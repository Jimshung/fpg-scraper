import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupTempFiles } from './captchaSolver.js';
import { closeBrowser } from './browserSetup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function clearScreenshotsFolder() {
  try {
    const exists = await fs
      .access(SCREENSHOTS_DIR)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      console.log('Clearing screenshots folder...');
      await fs.rm(SCREENSHOTS_DIR, { recursive: true, force: true });
      console.log('Screenshots folder cleared.');
    } else {
      console.log('Screenshots folder does not exist. No need to clear.');
    }
  } catch (error) {
    console.error('Error while clearing screenshots folder:', error);
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

async function handleDialog(page, action) {
  page.on('dialog', async (dialog) => {
    console.log('檢測到彈出視窗，正在關閉...');
    await dialog.dismiss();
  });
  await action();
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

async function inputCaseNumber(page, caseNumber) {
  console.log(`輸入標售案號: ${caseNumber}`);
  try {
    await page.click('input[type="radio"][value="radio1"]');
    await page.type('input[name="tndsalno"]', caseNumber);
    console.log('案號輸入完成');
  } catch (error) {
    console.error('輸入案號時發生錯誤:', error);
    throw error;
  }
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

export {
  clearScreenshotsFolder,
  clickElementByText,
  handleDialog,
  getTodayDate,
  ensureScreenshotsDirExists,
  takeScreenshot,
  wait,
  initializeEnvironment,
  cleanup,
  pressESC,
  inputCaseNumber,
};
