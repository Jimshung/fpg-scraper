import { loginFPG, closeBrowser } from './browserSetup.js';
import {
  clearScreenshotsFolder,
  ensureScreenshotsDirExists,
  takeScreenshot,
  wait,
  clickElementByText,
  getTodayDate,
  handleDialog,
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

      // const today = this.getTodayDate();
      // await this.selectDateRange(today, today);
      // await this.selectAnnouncementDate();

      // await this.inputCaseNumber('RT-UR01L9');
      await this.inputCaseNumber('06-UR0M33');
      await this.performSearch();

      await this.confirmSearchResults();
      const isTaskCompleted = await this.clickCheckbox();

      if (isTaskCompleted) {
        console.log('任務完成，準備結束流程');
        return true; // 表示任務已完成
      }

      console.log('繼續執行其他任務...');
      // 在這裡可以添加其他任務的代碼

      return false; // 表示還有其他任務需要執行
    } catch (error) {
      console.error('搜尋過程中發生錯誤:', error);
      throw error;
    }
  }

  async confirmSearchResults() {
    console.log('確認搜尋結果頁面...');
    try {
      const pageTitle = await this.page.$eval(
        'div[align="center"] font[color="#FFFFFF"] b',
        (el) => el.textContent.trim()
      );
      if (pageTitle === '標售公報查詢清單') {
        console.log('成功找到標售公報查詢清單頁面');
      } else {
        throw new Error('未找到預期的頁面標題');
      }
    } catch (error) {
      console.error('確認搜尋結果頁面時發生錯誤:', error);
      throw error;
    }
  }

  async clickCheckbox() {
    try {
      const checkboxSelector =
        'input[type="checkbox"][name="item"][onclick="goCheck(this.form,this)"]';
      const checkbox = await this.page.$(checkboxSelector);

      if (checkbox) {
        console.log('找到符合條件的 checkbox，正在點擊...');
        await handleDialog(this.page, async () => {
          await checkbox.click();
          await wait(1000);
          await this.page.keyboard.press('Escape');
        });
        console.log('已處理可能的彈出視窗');
        await this.clickSaveButton();
        return true;
      } else {
        console.log('未找到符合條件的 checkbox，準備點擊回主畫面按鈕');
        await this.clickBackToMainButton();
        return true;
      }
    } catch (error) {
      console.error('處理 checkbox 時發生錯誤:', error);
      throw error;
    }
  }

  async pressESC() {
    console.log('模擬按下 ESC 鍵...');
    await this.page.keyboard.press('Escape');
    console.log('已按下 ESC 鍵');
  }

  async clickBackToMainButton() {
    try {
      const backButtonSelector =
        'input[type="button"][value="回主畫面"][onclick="goSearch(this.form,\'srh\')"]';
      await this.page.click(backButtonSelector);
      console.log('成功導航回主畫面');
    } catch (error) {
      console.error('點擊回主畫面按鈕時發生錯誤:', error);
      throw error;
    }
  }

  async clickSaveButton() {
    try {
      const backButtonSelector =
        "input[type=\"button\"][value=\"轉報價作業\"][onclick=\"goSave(this.form,'all','ntidat','all','T')\"]";
      await this.page.click(backButtonSelector);
      console.log('成功導航轉報價作業');
    } catch (error) {
      console.error('點擊轉報價作業按鈕時發生錯誤:', error);
      throw error;
    }
  }

  async inputCaseNumber(caseNumber) {
    console.log(`輸入標售案號: ${caseNumber}`);
    try {
      await this.page.click('input[type="radio"][value="radio1"]');
      await this.page.type('input[name="tndsalno"]', caseNumber);
      console.log('案號輸入完成');
    } catch (error) {
      console.error('輸入案號時發生錯誤:', error);
      throw error;
    }
  }

  async clickSaleBulletinLink() {
    await clickElementByText(this.page, '.menu_pos a', '標售公報');
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
      const isTaskCompleted = await automation.navigateToSaleBulletin();

      if (isTaskCompleted) {
        console.log('所有任務已完成，準備關閉瀏覽器。');
      } else {
        console.log('還有其他任務需要執行，請在此處添加相應的代碼。');
        // 在這裡可以添加其他任務的代碼
      }
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
