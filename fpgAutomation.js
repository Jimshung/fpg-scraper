import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const MAX_LOGIN_ATTEMPTS = 5;
const CAPTCHA_REFRESH_DELAY = 1000;

class FPGAutomation {
  constructor(page) {
    this.page = page;
  }

  async navigateToSaleBulletin() {
    console.log('正在導航到標售公報頁面...');
    try {
      await this.clickSaleBulletinLink();
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('成功導航到標售公報頁面');
      await this.takeScreenshot('標售公報頁面');

      const today = this.getTodayDate();
      await this.selectDateRange(today, today);
      await this.selectAnnouncementDate();
      await this.performSearch();

      console.log('搜尋完成並已截圖');
    } catch (error) {
      console.error('搜尋過程中發生錯誤:', error);
      throw error;
    }
  }

  async clickSaleBulletinLink() {
    await this.page.waitForSelector('.menu_pos', { timeout: 10000 });
    const linkFound = await this.page.evaluate(() => {
      const menuElement = document.querySelector('.menu_pos');
      if (menuElement) {
        const links = Array.from(menuElement.querySelectorAll('a'));
        const targetLink = links.find((link) =>
          link.textContent.includes('標售公報')
        );
        if (targetLink) {
          targetLink.click();
          return true;
        }
      }
      return false;
    });

    if (!linkFound) {
      throw new Error('未找到標售公報連結');
    }
  }

  async selectDateRange(startDate, endDate) {
    console.log('選擇日期範圍...');
    try {
      await this.page.click('input[type="radio"][value="radio2"]');
      await this.ensureDateInputsVisible();
      await this.selectDate('#button3', startDate);
      await this.selectDate('#button4', endDate);
      await this.verifySelectedDates(startDate, endDate);
    } catch (error) {
      console.error('選擇日期範圍時發生錯誤:', error);
      throw error;
    }
  }

  async selectDate(buttonSelector, date) {
    const [popup] = await Promise.all([
      new Promise((resolve) => this.page.once('popup', resolve)),
      this.page.click(buttonSelector),
    ]);
    await popup.waitForSelector('table', { timeout: 5000 });
    await this.clickDateInPopup(popup, date);
    await popup.waitForSelector('body', { hidden: true }).catch(() => {});
  }

  async clickDateInPopup(popup, targetDate) {
    await popup.evaluate((date) => {
      const links = Array.from(document.querySelectorAll('table tr td a'));
      const targetLink = links.find((link) => {
        const onclickAttr = link.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`'${date}'`);
      });
      if (targetLink) targetLink.click();
      else throw new Error(`未找到日期 ${date} 的連結`);
    }, targetDate);
  }

  async ensureDateInputsVisible() {
    await this.page.waitForSelector('#date_f', {
      visible: true,
      timeout: 5000,
    });
    await this.page.waitForSelector('#date_e', {
      visible: true,
      timeout: 5000,
    });
  }

  async verifySelectedDates(startDate, endDate) {
    const startDateValue = await this.page.$eval('#date_f', (el) => el.value);
    const endDateValue = await this.page.$eval('#date_e', (el) => el.value);
    console.log(`日期範圍選擇完成: ${startDateValue} 至 ${endDateValue}`);
    if (startDateValue !== startDate || endDateValue !== endDate) {
      console.warn('選擇的日期可能不正確，請檢查。');
    }
  }

  async selectAnnouncementDate() {
    await this.page.click('input[type="radio"][value="ntidat"]');
  }

  async performSearch() {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
      this.page.click('input[type="button"][value="開始搜尋"]'),
    ]);
    await this.page.waitForSelector('table', { timeout: 10000 });
    await this.takeScreenshot('搜尋結果');
  }

  getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}/${String(today.getDate()).padStart(2, '0')}`;
  }

  async takeScreenshot(name) {
    await takeScreenshot(this.page, name);
  }
}

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

function findChromePath() {
  const paths = {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    linux: '/usr/bin/google-chrome',
  };
  return paths[process.platform] || null;
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `${name}_${Date.now()}.png`
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

async function getCaptchaImageBuffer(page) {
  const captchaImg = await page.$('img#vcode');
  return captchaImg.screenshot();
}

async function refreshCaptcha(page) {
  const refreshButton = await page.$('a img[alt="重新換一組驗證碼"]');
  if (refreshButton) {
    await refreshButton.click();
    await wait(CAPTCHA_REFRESH_DELAY);
  }
}

async function loginFPG() {
  const browser = await launchBrowser();
  const page = await setupPage(browser);

  try {
    await navigateToLoginPage(page);
    const loginSuccess = await attemptLogin(page);
    return { success: loginSuccess, page, browser };
  } catch (error) {
    console.error('登入過程中發生錯誤:', error);
    await takeScreenshot(page, 'error_page');
    await closeBrowser(browser);
    return { success: false, page: null, browser };
  }
}

async function launchBrowser() {
  const options = getBrowserOptions();
  console.log('Launching browser...');
  return await puppeteer.launch(options);
}

function getBrowserOptions() {
  const options = {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
    timeout: 30000,
  };

  const chromePath = process.env.CHROME_PATH || findChromePath();
  if (chromePath) {
    console.log(`Using Chrome at: ${chromePath}`);
    options.executablePath = chromePath;
  } else {
    console.log('Chrome path not found, using default Puppeteer browser');
  }

  return options;
}

async function setupPage(browser) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  return page;
}

async function navigateToLoginPage(page) {
  console.log(`Navigating to ${config.loginUrl}`);
  await page.goto(config.loginUrl, { waitUntil: 'networkidle0' });
  await takeScreenshot(page, 'login_page');
}

async function attemptLogin(page) {
  let loginSuccess = false;
  for (
    let attempts = 1;
    attempts <= MAX_LOGIN_ATTEMPTS && !loginSuccess;
    attempts++
  ) {
    console.log(`Login attempt ${attempts}`);
    await refreshCaptcha(page);

    const captchaBuffer = await getCaptchaImageBuffer(page);
    const captchaText = await solveCaptcha(captchaBuffer);

    if (captchaText === 'error' || captchaText.length !== 4) {
      console.log(`Invalid captcha: ${captchaText}`);
      continue;
    }

    await fillLoginForm(page, captchaText);
    await takeScreenshot(page, 'before_login');
    await submitLoginForm(page);
    await takeScreenshot(page, 'after_login');

    loginSuccess = await checkLoginSuccess(page);
    if (loginSuccess) {
      console.log('Login successful');
    } else {
      console.log('Login failed, retrying...');
      await navigateToLoginPage(page);
    }
  }
  return loginSuccess;
}

async function fillLoginForm(page, captchaText) {
  console.log('Filling login form...');
  await page.type('input[name="id"]', config.username);
  await page.type('input[name="passwd"]', config.password);
  await page.type('input[name="vcode"]', captchaText);
}

async function submitLoginForm(page) {
  const submitButton =
    (await page.$('input[type="submit"]')) ||
    (await page.$('input[type="button"][value="登入"]'));
  if (!submitButton) {
    throw new Error('無法找到登入按鈕');
  }

  console.log('Clicking login button');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    submitButton.click(),
  ]);
}

async function checkLoginSuccess(page) {
  return page.evaluate(() => {
    const menuElement = document.querySelector('.menu_pos');
    if (menuElement) {
      const menuText = menuElement.innerText;
      return (
        menuText.includes('熱訊') &&
        menuText.includes('標售公報') &&
        menuText.includes('標案管理')
      );
    }
    return false;
  });
}

async function closeBrowser(browser) {
  console.log('Closing browser');
  await browser.close();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let browser = null;
  try {
    await clearScreenshotsFolder();
    await ensureScreenshotsDirExists();
    const { success, page, browser: loginBrowser } = await loginFPG();
    browser = loginBrowser; // 將 loginBrowser 賦值給 browser

    if (success) {
      console.log('自動化登入流程完成。');
      const automation = new FPGAutomation(page);

      // 執行第一個動作
      await automation.navigateToSaleBulletin();

      // 這裡可以添加更多的流程...
    } else {
      console.log('自動化登入流程失敗，請檢查日誌並重試。');
    }
  } catch (error) {
    console.error('主程序執行錯誤:', error);
  } finally {
    await cleanupTempFiles();
    if (browser) {
      await closeBrowser(browser);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { loginFPG, main, FPGAutomation };
