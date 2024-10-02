# FPG Automation Project

## 專案簡介

本專案旨在自動化執行與網頁互動相關的流程，包括登入、表單提交、資料擷取等操作。為了提高代碼的可讀性與維護性，我們將整個專案劃分為三個主要的 JavaScript 文件：

### 文件說明

1. **`fpgAutomation.js`**:

   - 負責整合並控制整個自動化流程。
   - 包含主要自動化類別 `FPGAutomation`，以及各個流程的調用方法。

2. **`browserSetup.js`**:

   - 包含所有與 Puppeteer 瀏覽器設定相關的函數和流程。
   - 如瀏覽器啟動、頁面設置、登入操作等相關功能都在此模塊內定義。

3. **`utils.js`**:
   - 工具函數與輔助方法集合。
   - 包含通用的工具函數，例如：日期處理、格式化字串、處理錯誤等。

### 文件目錄結構

```plaintext
FPG-SCRAPER/
├── .cache/
├── .config/
├── node_modules/
├── screenshots/
├── .gitignore
├── browserSetup.js
├── captchaSolver.js
├── config.example.js
├── config.js
├── fpgAutomation.js
├── package.json
├── package-lock.json
├── README.md
└── utils.js
```

### 如何運行

1. **安裝相依套件**：

   ```bash
   npm install
   ```

2. **執行自動化流程**：

   ```bash
   node fpgAutomation.js
   ```
