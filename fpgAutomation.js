import { loginFPG, closeBrowser } from './browserSetup.js';
import {
  clearScreenshotsFolder,
  ensureScreenshotsDirExists,
  takeScreenshot,
  wait,
} from './utils.js';
import { cleanupTempFiles } from './captchaSolver.js';

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
    await this.page.evaluate(() => {
      const menuElement = document.querySelector('.menu_pos');
      const links = Array.from(menuElement.querySelectorAll('a'));
      const targetLink = links.find((link) =>
        link.textContent.includes('標售公報')
      );
      targetLink.click();
    });
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

async function main() {
  let browser = null;
  try {
    await clearScreenshotsFolder();
    await ensureScreenshotsDirExists();
    const { success, page, browser: loginBrowser } = await loginFPG();
    browser = loginBrowser;

    if (success) {
      console.log('自動化登入流程完成。');
      const automation = new FPGAutomation(page);
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

export { FPGAutomation, main };
