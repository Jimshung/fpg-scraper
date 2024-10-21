import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupTempFiles } from './captchaSolver.js';
import { closeBrowser } from './browserSetup.js';

const SELECTORS = {
  CASE_NUMBER_RADIO: 'input[type="radio"][value="radio1"]',
  CASE_NUMBER_INPUT: 'input[name="tndsalno"]',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function clearScreenshotsFolder() {
  try {
    const exists = await fs
      .access(SCREENSHOTS_DIR)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.log('Screenshots 資料夾不存在。無需清理。');
      return;
    }

    console.log('正在清理 Screenshots 資料夾...');
    await fs.rm(SCREENSHOTS_DIR, { recursive: true, force: true });
    console.log('Screenshots 資料夾已清理完成。');
  } catch (error) {
    console.error('清理 Screenshots 資料夾時發生錯誤:', error);
  }
}

async function ensureScreenshotsDirExists() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log('Screenshots directory ensured.');
  } catch (error) {
    console.error('Error while creating screenshots directory:', error);
  }
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `${name}_${Date.now()}.png`
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

async function clickElementByText(page, selector, text) {
  await page.evaluate(
    (selector, text) => {
      const elements = Array.from(document.querySelectorAll(selector));
      const element = elements.find((el) => el.textContent.includes(text));
      if (element) element.click();
      else throw new Error(`未找到包含文字 "${text}" 的元素`);
    },
    selector,
    text
  );
}

async function handleDialog(page, action, timeout = 5000) {
  return new Promise(async (resolve, reject) => {
    let dialogHandled = false;
    let timeoutId;

    const dialogHandler = async (dialog) => {
      if (dialogHandled) return;
      dialogHandled = true;
      clearTimeout(timeoutId);
      try {
        await dialog.dismiss();
        console.log('對話框已被成功關閉');
        resolve();
      } catch (error) {
        console.warn('關閉對話框時發生錯誤:', error.message);
        reject(error);
      }
    };

    page.once('dialog', dialogHandler);

    timeoutId = setTimeout(() => {
      if (!dialogHandled) {
        console.log('對話框處理超時');
        resolve();
      }
    }, timeout);

    try {
      await action();
      if (!dialogHandled) {
        clearTimeout(timeoutId);
        resolve();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

async function initializeEnvironment() {
  await clearScreenshotsFolder();
  await ensureScreenshotsDirExists();
}

async function cleanup(browser) {
  await cleanupTempFiles();
  if (browser) {
    await closeBrowser(browser);
  }
}

async function pressESC(page) {
  console.log('模擬按下 ESC 鍵...');
  await page.keyboard.press('Escape');
  console.log('已按下 ESC 鍵');
}

/**
 * 在指定的頁面上輸入案號
 * @param {Page} page - Puppeteer 的 Page 對象
 * @param {string} caseNumber - 要輸入的案號
 */
async function inputCaseNumber(page, caseNumber) {
  try {
    await page.click(SELECTORS.CASE_NUMBER_RADIO);
    await page.type(SELECTORS.CASE_NUMBER_INPUT, caseNumber);
    console.log('案號輸入完成');
  } catch (error) {
    console.error('輸入案號時發生錯誤:', error);
    throw error; // 或者根據需求進行錯誤處理
  }
}

async function navigateToNextPage(page) {
  const hasNextPage = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const nextPageLink = links.find(
      (link) => link.textContent.trim() === '下一頁'
    );
    if (nextPageLink) {
      nextPageLink.click();
      return true;
    }
    return false;
  });

  if (hasNextPage) {
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('已成功導航到下一頁');
  } else {
    console.log('沒有下一頁可跳轉');
  }

  return hasNextPage;
}

async function waitForSelector(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

async function evaluateAndClick(page, selector) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) element.click();
    else throw new Error(`未找到元素: ${sel}`);
  }, selector);
}

async function goToSpecificPage(page, pageNumber) {
  try {
    await page.evaluate((page) => {
      document.querySelector('input[name="gtpage1"]').value = page;
      document.querySelector('input[value="Go"]').click();
    }, pageNumber);
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log(`已跳轉到第 ${pageNumber} 頁`);

    await wait(3000);
  } catch (error) {
    console.error(`跳轉到第 ${pageNumber} 頁時發生錯誤:`, error);
    await takeScreenshot(page, `錯誤_跳轉到第 ${pageNumber} 頁`);
    throw error;
  }
}

async function retryOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`操作失敗，嘗試次數：${attempt}，錯誤：`, error.message);
      if (attempt === maxRetries) throw error;
      await wait(1000 * attempt);
    }
  }
}

async function handleError(page, operation, error) {
  console.error(`執行 ${operation} 時發生錯誤:`, error);
  await takeScreenshot(page, `錯誤_${operation}`);
  throw error;
}

function isLastPage(currentPage, totalPages) {
  return currentPage === totalPages;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}/${String(today.getDate()).padStart(2, '0')}`;
}
function isValidCaseNumber(caseNumber) {
  const caseNumberPattern = /^[A-Z0-9]{2}-[A-Z0-9]{5}$/;
  return caseNumber && caseNumberPattern.test(caseNumber);
}
function validateSearchCriteria(caseNumber, useDate) {
  if (caseNumber && !this.isValidCaseNumber(caseNumber)) {
    console.error('案號格式無效，搜索終止');
    return false;
  }
  if (!caseNumber && !useDate) {
    console.error('未提供有效的搜索條件');
    return false;
  }
  return true;
}

export {
  clickElementByText,
  handleDialog,
  getTodayDate,
  takeScreenshot,
  wait,
  initializeEnvironment,
  cleanup,
  pressESC,
  inputCaseNumber,
  isLastPage,
  navigateToNextPage,
  waitForSelector,
  evaluateAndClick,
  goToSpecificPage,
  retryOperation,
  handleError,
  validateSearchCriteria,
};
