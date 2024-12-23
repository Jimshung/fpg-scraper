import { loginFPG } from './browserSetup.js';
import {
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
  waitForPopupSelector,
  waitForSelectorWithTimeout,
  waitForPopupClosed,
  goToSpecificPage,
  retryOperation,
  handleError,
  validateSearchCriteria,
  retryWithTimeout,
} from './utils.js';

const SELECTORS = {
  SEARCH_RESULT:
    'div[align="center"] font[color="#FFFFFF"] b, td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
  SUCCESS_TITLE: 'div[align="center"] font[color="#FFFFFF"] b',
  ERROR_MESSAGE: 'td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
};

const MESSAGES = {
  SUCCESS_TITLE: '標售公報查詢清單',
  NOT_FOUND: '找不到您輸入的案號',
};

class FPGAutomation {
  constructor(page) {
    this.page = page;
    this.options = {};
    this.navigationManager = new NavigationManager(page);
    this.searchManager = new SearchManager(page);
    this.resultProcessor = new ResultProcessor(page, this.options);
  }

  async run(options) {
    this.options = options;
    this.resultProcessor.updateOptions(options);
    await this.navigationManager.navigateToSaleBulletin();
    const searchSuccess = await this.searchManager.performSearch(options);
    if (searchSuccess) {
      await this.resultProcessor.processResults(options);
    }
  }
}

class NavigationManager {
  constructor(page) {
    this.page = page;
  }

  async navigateToSaleBulletin() {
    console.log('正在導航到標售公報頁面...');
    try {
      await clickElementByText(this.page, '.menu_pos a', '標售公報');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('成功導航到標售公報頁面');
      await takeScreenshot(this.page, '標售公報頁面');
      return true;
    } catch (error) {
      await handleError(this.page, '導航到標售公報', error);
    }
  }

  async clickBackToMainButton() {
    try {
      await this.page.click(
        'input[type="button"][value="回主畫面"][onclick="goSearch(this.form,\'srh\')"]'
      );
      console.log('成功導航回主畫面');
    } catch (error) {
      return handleError(this.page, '點擊回主畫面按鈕', error);
    }
  }
}

class SearchManager {
  constructor(page) {
    this.page = page;
  }

  async performSearch(options = {}) {
    const { caseNumber, useDate, startDate, endDate } = options;

    if (!validateSearchCriteria(caseNumber, useDate)) {
      return false;
    }

    try {
      await this.inputSearchCriteria(caseNumber, useDate, startDate, endDate);
      await this.clickSearchButton();
      return await this.processSearchResults();
    } catch (error) {
      return await this.handleSearchError(error);
    }
  }

  async inputSearchCriteria(caseNumber, useDate, startDate, endDate) {
    if (caseNumber) {
      await this.performCaseNumberInput(caseNumber);
    }
    if (useDate) {
      await this.selectDateRange(startDate, endDate);
      await this.selectAnnouncementDate();
    }
  }

  async processSearchResults() {
    const searchResult = await this.confirmSearchResults();
    if (!searchResult.success) {
      console.log('搜尋未找到結果:', searchResult.message);
      return false;
    }
    console.log('搜索成功完成');
    return true;
  }

  async handleSearchError(error) {
    console.error('執行搜索時發生錯誤:', error);
    await takeScreenshot(this.page, '搜索錯誤');
    return false;
  }

  async performCaseNumberInput(caseNumber) {
    try {
      await inputCaseNumber(this.page, caseNumber);
    } catch (error) {
      console.error('輸入案號時發生錯誤:', error);
      throw error;
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
    await waitForPopupSelector(popup, 'table');
    await this.clickDateInPopup(popup, date);
    await waitForPopupClosed(popup);
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
    await waitForSelector(this.page, '#date_f');
    await waitForSelector(this.page, '#date_e');
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

  async clickSearchButton() {
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
        this.page.click('input[type="button"][value="開始搜尋"]'),
      ]);
      await waitForSelector(this.page, 'table', { timeout: 10000 });
      await takeScreenshot(this.page, '搜尋結果');
    } catch (error) {
      await handleError(this.page, '點擊搜索按鈕', error);
    }
  }

  async confirmSearchResults() {
    console.log('確認搜尋結果頁面...');
    try {
      await waitForSelectorWithTimeout(
        this.page,
        SELECTORS.SEARCH_RESULT,
        10000
      );

      const result = await this.getSearchResult();
      return this.processSearchResult(result);
    } catch (error) {
      return await this.handleConfirmError(error);
    }
  }

  async getSearchResult() {
    const successTitle = await this.getElementText(SELECTORS.SUCCESS_TITLE);
    if (successTitle === MESSAGES.SUCCESS_TITLE) {
      return { success: true, message: '查詢成功' };
    }

    const errorMessage = await this.getElementText(SELECTORS.ERROR_MESSAGE);
    if (errorMessage) {
      return { success: false, message: errorMessage };
    }

    throw new Error('頁面內容不符合預期');
  }

  async getElementText(selector) {
    return this.page
      .$eval(selector, (el) => el.textContent.trim())
      .catch(() => null);
  }

  processSearchResult(result) {
    if (result.success) {
      console.log('成功找到標售公報查詢清單頁面');
    } else if (result.message.includes(MESSAGES.NOT_FOUND)) {
      console.log('查詢未找到結果：', result.message);
    } else {
      console.log('搜尋結果異常：', result.message);
    }
    return result;
  }

  async handleConfirmError(error) {
    console.error('確認搜尋結果時發生錯誤:', error.message);
    await takeScreenshot(this.page, '錯誤_確認搜尋結果');
    return { success: false, message: error.message };
  }
}

class ResultProcessor {
  constructor(page, options = {}) {
    this.page = page;
    this.options = options;
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  async processResults(options) {
    try {
      if (options.useDate) {
        await this.handleMultiPageCheckboxSelection();
      } else {
        await this.handleSinglePageResult();
      }
      console.log('結果處理完成');
      return true;
    } catch (error) {
      console.error('處理結果時發生錯誤:', error);
      return false;
    }
  }

  async handleMultiPageCheckboxSelection() {
    let currentPage = 1;
    const totalPages = await this.getTotalPages();

    while (currentPage <= totalPages) {
      console.log(`正在處理第 ${currentPage}/${totalPages} 頁`);

      const checkboxesFound = await this.selectAllCheckboxesOnCurrentPage();

      if (checkboxesFound > 0) {
        await this.handlePageWithCheckboxes(currentPage, totalPages);
      } else {
        await this.handlePageWithoutCheckboxes(currentPage, totalPages);
      }

      if (isLastPage(currentPage, totalPages)) break;

      currentPage++;
    }

    console.log('所有頁面的複選框處理完畢');
    await takeScreenshot(this.page, '所有頁面的複選框處理完畢');
  }

  async handleSinglePageResult() {
    const checkbox = await this.page.$(
      'input[type="checkbox"][name="item"][onclick="goCheck(this.form,this)"]'
    );
    if (!checkbox) {
      console.log('未找到符合條件的 checkbox，準備點擊回主畫面按鈕');
      await this.clickBackToMainButton();
      return true;
    }
    console.log('找到符合條件的 checkbox，正在點擊...');
    await handleDialog(this.page, async () => {
      await checkbox.click();
      await wait(1000);
    });
    await pressESC(this.page);
    console.log('已處理可能的彈出視窗');
    await this.clickSaveButton();
  }

  async getTotalPages() {
    const totalPages = await this.page.evaluate(() => {
      const input = document.querySelector('input[name="gtpage2"]');
      const textAfterInput = input.nextSibling.textContent.trim();
      const match = textAfterInput.match(/\/(\d+)頁/);
      return match ? parseInt(match[1]) : 1;
    });
    console.log(`總頁數: ${totalPages}`);
    return totalPages;
  }

  async selectAllCheckboxesOnCurrentPage() {
    const checkboxes = await this.page.$$(
      'input[type="checkbox"][name="item"][onclick="goCheck(this.form,this)"]'
    );
    console.log(`當前頁面上找到 ${checkboxes.length} 個複選框`);

    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i];
      await retryOperation(async () => {
        const isChecked = await this.isCheckboxChecked(checkbox);
        if (isChecked) {
          console.log(`第 ${i + 1} 個複選框已經被勾選，跳過`);
          return;
        }

        await handleDialog(this.page, async () => {
          await checkbox.click();
          await wait(1000);
        });
        console.log(`成功處理第 ${i + 1} 個複選框`);
      });
    }

    console.log(`已嘗試選擇當前頁面上的所有未勾選的複選框`);
    return checkboxes.length;
  }

  async isCheckboxChecked(checkbox) {
    return await this.page.evaluate((el) => {
      if (el.checked) return true;

      const isParentSelected = el.closest('tr')?.classList.contains('selected');
      if (isParentSelected) return true;

      const label = document.querySelector(`label[for="${el.id}"]`);
      return label?.textContent.includes('已選擇') || false;
    }, checkbox);
  }

  async handlePageWithCheckboxes(currentPage, totalPages) {
    await this.clickSaveButton();
    console.log(`第 ${currentPage} 頁的選擇已保存`);

    if (!isLastPage(currentPage, totalPages)) {
      await this.reSearchAndGoToPage(currentPage + 1);
    } else {
      console.log('已處理完最後一頁，完成全部操作');
    }
  }

  async handlePageWithoutCheckboxes(currentPage, totalPages) {
    console.log(`第 ${currentPage} 頁沒有找到複選框`);
    if (!isLastPage(currentPage, totalPages)) {
      await navigateToNextPage(this.page);
    } else {
      console.log('最後一頁沒有複選框，返回主畫面');
      await this.clickBackToMainButton();
    }
  }
  async navigateToMainScreen() {
    return retryWithTimeout(
      async () => {
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
          this.page.click(
            'input[type="button"][value="回主畫面"][onclick="goList(this.form)"]'
          ),
        ]);
        await wait(2000);
      },
      3,
      15000
    );
  }

  async performNewSearch() {
    return retryWithTimeout(
      async () => {
        await waitForSelector(
          this.page,
          'input[type="button"][value="開始搜尋"]',
          {
            visible: true,
            timeout: 15000,
          }
        );

        const searchManager = new SearchManager(this.page);
        const searchSuccess = await searchManager.performSearch(this.options);

        if (!searchSuccess) {
          throw new Error('重新搜索失敗');
        }

        await wait(2000);
      },
      3,
      30000
    );
  }
  async reSearchAndGoToPage(pageNumber) {
    try {
      console.log(`重新搜索並跳轉到第 ${pageNumber} 頁`);
      await takeScreenshot(this.page, `重新搜索並跳轉到第 ${pageNumber} 頁`);
      // 步驟1: 回到主畫面
      await this.navigateToMainScreen();
      // 步驟2: 執行新的搜索
      await this.performNewSearch();
      await retryWithTimeout(
        async () => await goToSpecificPage(this.page, pageNumber),
        3,
        20000
      );

      return true;
    } catch (error) {
      await this.handleReSearchError(error, pageNumber);
      return false;
    }
  }

  async handleReSearchError(error, pageNumber) {
    console.error(`重新搜索並跳轉到第 ${pageNumber} 頁時發生錯誤:`, error);
    await takeScreenshot(this.page, `錯誤_重新搜索並跳轉到第 ${pageNumber} 頁`);

    try {
      console.log('嘗試恢復操作...');
      await this.page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
      await wait(3000);
    } catch (recoveryError) {
      console.error('恢復操作失敗:', recoveryError);
    }
  }

  async clickSaveButton() {
    try {
      await this.page.click(
        "input[type=\"button\"][value=\"轉報價作業\"][onclick=\"goSave(this.form,'all','ntidat','all','T')\"]"
      );
      console.log('成功導航轉報價作業');
    } catch (error) {
      await handleError(this.page, '點擊轉報價作業按鈕', error);
    }
  }

  async clickBackToMainButton() {
    try {
      await this.page.click(
        'input[type="button"][value="回主畫面"][onclick="goSearch(this.form,\'srh\')"]'
      );
      console.log('成功導航回主畫面');
    } catch (error) {
      await handleError(this.page, '點擊回主畫面按鈕', error);
    }
  }
}

async function runAutomation(options) {
  let browser = null;
  try {
    await initializeEnvironment();
    const {
      success,
      page,
      browser: loginBrowser,
    } = await loginFPG(options.isHeadless);
    browser = loginBrowser;

    if (success) {
      console.log('自動化登入流程完成。');
      const automation = new FPGAutomation(page);
      await automation.run(options);
    } else {
      console.log('自動化登入流程失敗，請檢查日誌並重試。');
    }
  } catch (error) {
    console.error('自動化流程執行錯誤:', error);
  } finally {
    await cleanup(browser);
  }
}

async function main() {
  try {
    const today = getTodayDate();

    const options = {
      caseNumber: '',
      useDate: true,
      startDate: today,
      endDate: today,
      isHeadless: process.env.GITHUB_ACTIONS === 'true',
    };

    await runAutomation(options);
    console.log('自動化流程成功完成');
  } catch (error) {
    console.error('執行過程中發生錯誤:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('主程序執行失敗:', error);
    process.exit(1);
  });
}

export { FPGAutomation, runAutomation, main };
