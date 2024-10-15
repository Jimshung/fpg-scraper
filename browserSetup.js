import puppeteer from 'puppeteer';
import { takeScreenshot, wait } from './utils.js';
import { solveCaptcha } from './captchaSolver.js';
import config from './configLoader.js';

const MAX_LOGIN_ATTEMPTS = 5;
const CAPTCHA_REFRESH_DELAY = 1000;

function findChromePath() {
  const paths = {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    linux: '/usr/bin/google-chrome',
  };
  return paths[process.platform] || null;
}

async function launchBrowser() {
  const options = getBrowserOptions();
  console.log('Launching browser...');
  return await puppeteer.launch(options);
}

function getBrowserOptions() {
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

  const options = {
    headless: isGitHubActions ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
    timeout: 30000,
  };

  if (!isGitHubActions) {
    const chromePath = process.env.CHROME_PATH || findChromePath();
    if (chromePath) {
      console.log(`使用Chrome路徑: ${chromePath}`);
      options.executablePath = chromePath;
    } else {
      console.log('未找到Chrome路徑，使用Puppeteer預設瀏覽器');
    }
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

export { loginFPG, closeBrowser };
