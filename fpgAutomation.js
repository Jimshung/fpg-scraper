import { loginFPG } from './browserSetup.js';
import {
  takeScreenshot,
  wait,
  clickElementByText,
  handleDialog,
  initializeEnvironment,
  cleanup,
  pressESC,
  inputCaseNumber,
} from './utils.js';

class FPGAutomation {
  static SELECTORS = {
    SALE_BULLETIN_LINK: '.menu_pos a',
    SEARCH_RESULT:
      'div[align="center"] font[color="#FFFFFF"] b, td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
    SUCCESS_TITLE: 'div[align="center"] font[color="#FFFFFF"] b',
    ERROR_MESSAGE: 'td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
    CHECKBOX:
      'input[type="checkbox"][name="item"][onclick="goCheck(this.form,this)"]',
    CASE_NUMBER_RADIO: 'input[type="radio"][value="radio1"]',
    CASE_NUMBER_INPUT: 'input[name="tndsalno"]',
    SEARCH_BUTTON: 'input[type="button"][value="開始搜尋"]',
    BACK_TO_MAIN_BUTTON:
      'input[type="button"][value="回主畫面"][onclick="goSearch(this.form,\'srh\')"]',
    SAVE_BUTTON:
      "input[type=\"button\"][value=\"轉報價作業\"][onclick=\"goSave(this.form,'all','ntidat','all','T')\"]",
  };

  constructor(page) {
    this.page = page;
  }

  async handleError(operation, error) {
    console.error(`執行 ${operation} 時發生錯誤:`, error);
    await this.takeScreenshot(`錯誤_${operation}`);
    throw error;
  }

  async pressESC() {
    await pressESC(this.page);
  }

  async performCaseNumberInput(caseNumber) {
    try {
      await inputCaseNumber(this.page, caseNumber);
    } catch (error) {
      return this.handleError('輸入案號', error);
    }
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
      await this.performCaseNumberInput('02-UQ1RX3');
      await this.performSearch();

      const searchResult = await this.confirmSearchResults();
      if (!searchResult.success) {
        console.log('搜尋未找到結果:', searchResult.message);
        return true; // 或根據您的需求返回 false
      }

      const isTaskCompleted = await this.clickCheckbox();

      if (isTaskCompleted) {
        console.log('任務完成，準備結束流程');
        return true; // 表示任務已完成
      }

      console.log('繼續執行其他任務...');
      // 在這裡可以添加其他任務的代碼

      return false; // 表示還有其他任務需要執行
    } catch (error) {
      return this.handleError('導航到標售公報', error);
    }
  }

  async confirmSearchResults() {
    console.log('確認搜尋結果頁面...');
    try {
      // 等待可能出現的兩種元素
      await this.page.waitForSelector(FPGAutomation.SELECTORS.SEARCH_RESULT, {
        timeout: 10000,
      });

      // 檢查是否存在成功的查詢結果
      const successTitle = await this.page
        .$eval(FPGAutomation.SELECTORS.SUCCESS_TITLE, (el) =>
          el.textContent.trim()
        )
        .catch(() => null);

      if (successTitle === '標售公報查詢清單') {
        console.log('成功找到標售公報查詢清單頁面');
        return { success: true, message: '查詢成功' };
      }

      // 檢查是否存在錯誤訊息
      const errorMessage = await this.page
        .$eval(FPGAutomation.SELECTORS.ERROR_MESSAGE, (el) =>
          el.textContent.trim()
        )
        .catch(() => null);

      if (errorMessage && errorMessage.includes('找不到您輸入的案號')) {
        console.log('查詢未找到結果：', errorMessage);
        return { success: false, message: errorMessage };
      }

      // 如果兩種情況都沒有匹配，拋出錯誤
      throw new Error('頁面內容不符合預期');
    } catch (error) {
      return this.handleError('確認搜尋結果', error);
    }
  }

  async clickCheckbox() {
    try {
      const checkbox = await this.page.$(FPGAutomation.SELECTORS.CHECKBOX);

      if (!checkbox) {
        console.log('未找到符合條件的 checkbox，準備點擊回主畫面按鈕');
        await this.clickBackToMainButton();
        return true;
      }

      console.log('找到符合條件的 checkbox，正在點擊...');
      await handleDialog(this.page, async () => {
        await checkbox.click();
        await wait(1000);
        await this.page.keyboard.press('Escape');
      });
      console.log('已處理可能的彈出視窗');
      await this.clickSaveButton();
      return true;
    } catch (error) {
      return this.handleError('處理 checkbox', error);
    }
  }

  async pressESC() {
    console.log('模擬按下 ESC 鍵...');
    await this.page.keyboard.press('Escape');
    console.log('已按下 ESC 鍵');
  }

  async clickBackToMainButton() {
    try {
      await this.page.click(FPGAutomation.SELECTORS.BACK_TO_MAIN_BUTTON);
      console.log('成功導航回主畫面');
    } catch (error) {
      return this.handleError('點擊回主畫面按鈕', error);
    }
  }

  async clickSaveButton() {
    try {
      await this.page.click(FPGAutomation.SELECTORS.SAVE_BUTTON);
      console.log('成功導航轉報價作業');
    } catch (error) {
      return this.handleError('點擊轉報價作業按鈕', error);
    }
  }

  async clickSaleBulletinLink() {
    try {
      await clickElementByText(
        this.page,
        FPGAutomation.SELECTORS.SALE_BULLETIN_LINK,
        '標售公報'
      );
    } catch (error) {
      return this.handleError('點擊標售公報連結', error);
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
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
        this.page.click(FPGAutomation.SELECTORS.SEARCH_BUTTON),
      ]);
      await this.page.waitForSelector('table', { timeout: 10000 });
      await this.takeScreenshot('搜尋結果');
    } catch (error) {
      return this.handleError('執行搜尋', error);
    }
  }

  async takeScreenshot(name) {
    await takeScreenshot(this.page, name);
  }
}

async function main() {
  let browser = null;
  try {
    await initializeEnvironment();
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
    await cleanup(browser);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { FPGAutomation, main };
