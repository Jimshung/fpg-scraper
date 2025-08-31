# FPG Automation - Comprehensive API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Classes](#core-classes)
4. [Public Functions](#public-functions)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Types & Interfaces](#types--interfaces)

## Overview

The FPG Automation project provides a comprehensive automation framework for web scraping and form automation using Puppeteer. It includes modules for browser management, CAPTCHA solving, utility functions, and configuration management.

### Key Features

- **Automated Login**: Handles login flows with CAPTCHA solving
- **Web Scraping**: Automated data extraction and form submission
- **Browser Management**: Puppeteer browser lifecycle management
- **CAPTCHA Solving**: Azure Computer Vision integration for CAPTCHA recognition
- **Configuration Management**: Flexible configuration with environment variable support
- **Error Handling**: Robust error handling and retry mechanisms

## Installation & Setup

### Prerequisites

- Node.js >= 18.17.0
- Google Chrome browser
- Azure Computer Vision API (for CAPTCHA solving)

### Installation

```bash
npm install
```

### Configuration

Create a `config.js` file based on `config.example.js`:

```javascript
export default {
  azureEndpoint: 'YOUR_AZURE_ENDPOINT',
  azureApiKey: 'YOUR_AZURE_API_KEY',
  loginUrl: 'YOUR_LOGIN_URL',
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD',
  headless: false // Set to true for headless mode
};
```

Or use environment variables:
- `AZURE_ENDPOINT`
- `AZURE_API_KEY`
- `LOGIN_URL`
- `FPG_USERNAME`
- `FPG_PASSWORD`
- `HEADLESS`

## Core Classes

### FPGAutomation

Main automation orchestrator class that coordinates the entire automation workflow.

```javascript
import { FPGAutomation } from './fpgAutomation.js';
```

#### Constructor

```javascript
new FPGAutomation(page)
```

**Parameters:**
- `page` (Page): Puppeteer page instance

#### Methods

##### `async run(options)`

Executes the complete automation workflow.

**Parameters:**
- `options` (Object): Automation options
  - `caseNumber` (string, optional): Specific case number to search for
  - `useDate` (boolean): Whether to use date-based search
  - `startDate` (string): Start date for search (YYYY-MM-DD format)
  - `endDate` (string): End date for search (YYYY-MM-DD format)
  - `isHeadless` (boolean): Whether to run in headless mode

**Example:**
```javascript
const automation = new FPGAutomation(page);
await automation.run({
  caseNumber: '12345',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
});
```

### NavigationManager

Handles page navigation and UI interactions.

#### Constructor

```javascript
new NavigationManager(page)
```

**Parameters:**
- `page` (Page): Puppeteer page instance

#### Methods

##### `async navigateToSaleBulletin()`

Navigates to the sale bulletin page.

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
const navManager = new NavigationManager(page);
const success = await navManager.navigateToSaleBulletin();
```

##### `async clickBackToMainButton()`

Navigates back to the main page.

**Returns:** `Promise<void>`

### SearchManager

Manages search operations and form interactions.

#### Constructor

```javascript
new SearchManager(page)
```

#### Methods

##### `async performSearch(options)`

Performs search based on provided criteria.

**Parameters:**
- `options` (Object): Search options
  - `caseNumber` (string, optional): Case number to search
  - `useDate` (boolean): Use date-based search
  - `startDate` (string): Start date
  - `endDate` (string): End date

**Returns:** `Promise<boolean>` - Search success status

**Example:**
```javascript
const searchManager = new SearchManager(page);
const success = await searchManager.performSearch({
  caseNumber: '12345',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### ResultProcessor

Processes and handles search results.

#### Constructor

```javascript
new ResultProcessor(page, options)
```

## Public Functions

### Browser Setup Functions

#### `loginFPG(isHeadless)`

Performs automated login to the FPG system.

```javascript
import { loginFPG } from './browserSetup.js';

const result = await loginFPG(false);
// Returns: { success: boolean, page: Page, browser: Browser }
```

**Parameters:**
- `isHeadless` (boolean): Whether to run browser in headless mode

**Returns:** `Promise<Object>`
- `success` (boolean): Login success status
- `page` (Page): Puppeteer page instance
- `browser` (Browser): Puppeteer browser instance

**Example:**
```javascript
const { success, page, browser } = await loginFPG(false);
if (success) {
  console.log('Login successful');
  // Continue with automation
} else {
  console.log('Login failed');
}
```

#### `closeBrowser(browser)`

Safely closes the browser instance.

```javascript
import { closeBrowser } from './browserSetup.js';

await closeBrowser(browser);
```

**Parameters:**
- `browser` (Browser): Puppeteer browser instance to close

### CAPTCHA Solving Functions

#### `solveCaptcha(imageBuffer)`

Solves CAPTCHA using Azure Computer Vision API.

```javascript
import { solveCaptcha } from './captchaSolver.js';

const captchaText = await solveCaptcha(imageBuffer);
```

**Parameters:**
- `imageBuffer` (Buffer): Image buffer containing CAPTCHA

**Returns:** `Promise<string>` - Extracted CAPTCHA text or 'error' on failure

**Example:**
```javascript
const captchaElement = await page.$('img[src*="captcha"]');
const imageBuffer = await captchaElement.screenshot();
const captchaText = await solveCaptcha(imageBuffer);

if (captchaText !== 'error') {
  await page.type('#captcha-input', captchaText);
}
```

#### `cleanupTempFiles()`

Cleans up temporary files created during CAPTCHA processing.

```javascript
import { cleanupTempFiles } from './captchaSolver.js';

await cleanupTempFiles();
```

### Utility Functions

#### `takeScreenshot(page, name)`

Takes a screenshot of the current page.

```javascript
import { takeScreenshot } from './utils.js';

await takeScreenshot(page, 'login-page');
```

**Parameters:**
- `page` (Page): Puppeteer page instance
- `name` (string): Screenshot filename prefix

#### `clickElementByText(page, selector, text)`

Clicks an element containing specific text.

```javascript
import { clickElementByText } from './utils.js';

await clickElementByText(page, '.menu a', '標售公報');
```

**Parameters:**
- `page` (Page): Puppeteer page instance
- `selector` (string): CSS selector for elements to search
- `text` (string): Text content to match

#### `waitForSelector(page, selector, options)`

Waits for an element to appear on the page.

```javascript
import { waitForSelector } from './utils.js';

await waitForSelector(page, '#submit-button', { timeout: 10000 });
```

**Parameters:**
- `page` (Page): Puppeteer page instance
- `selector` (string): CSS selector to wait for
- `options` (Object, optional): Wait options
  - `timeout` (number): Maximum wait time in milliseconds
  - `visible` (boolean): Wait for element to be visible

#### `retryOperation(operation, maxRetries)`

Retries an operation with exponential backoff.

```javascript
import { retryOperation } from './utils.js';

const result = await retryOperation(async () => {
  return await page.click('#unreliable-button');
}, 3);
```

**Parameters:**
- `operation` (Function): Async function to retry
- `maxRetries` (number, default: 3): Maximum number of retry attempts

**Returns:** `Promise<any>` - Result of the successful operation

#### `validateSearchCriteria(caseNumber, useDate)`

Validates search criteria before performing search.

```javascript
import { validateSearchCriteria } from './utils.js';

const isValid = validateSearchCriteria('12345', true);
```

**Parameters:**
- `caseNumber` (string): Case number to validate
- `useDate` (boolean): Whether date-based search is used

**Returns:** `boolean` - Validation result

#### `getTodayDate()`

Gets today's date in YYYY-MM-DD format.

```javascript
import { getTodayDate } from './utils.js';

const today = getTodayDate();
// Returns: '2024-01-15'
```

#### `wait(ms)`

Pauses execution for specified milliseconds.

```javascript
import { wait } from './utils.js';

await wait(2000); // Wait 2 seconds
```

**Parameters:**
- `ms` (number): Milliseconds to wait

#### `handleDialog(page, action, timeout)`

Handles browser dialogs (alerts, confirms, prompts).

```javascript
import { handleDialog } from './utils.js';

await handleDialog(page, 'accept', 5000);
```

**Parameters:**
- `page` (Page): Puppeteer page instance
- `action` (string): Dialog action ('accept', 'dismiss', or text for prompts)
- `timeout` (number, default: 5000): Timeout in milliseconds

## Configuration

### Configuration Loading

The configuration system supports multiple sources with priority order:

1. Environment variables (highest priority)
2. Local `config.js` file
3. Default values from `config.example.js` (lowest priority)

#### Configuration Options

```javascript
{
  azureEndpoint: string,     // Azure Computer Vision endpoint
  azureApiKey: string,       // Azure API key
  loginUrl: string,          // Target login URL
  username: string,          // Login username
  password: string,          // Login password
  headless: boolean          // Browser headless mode
}
```

### Loading Configuration

```javascript
import config from './configLoader.js';

console.log('Azure Endpoint:', config.azureEndpoint);
console.log('Headless mode:', config.headless);
```

## Usage Examples

### Basic Automation Workflow

```javascript
import { runAutomation } from './fpgAutomation.js';

const options = {
  caseNumber: '',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
};

await runAutomation(options);
```

### Custom Automation with Manual Browser Setup

```javascript
import { FPGAutomation } from './fpgAutomation.js';
import { loginFPG } from './browserSetup.js';
import { initializeEnvironment, cleanup } from './utils.js';

async function customAutomation() {
  let browser = null;
  try {
    await initializeEnvironment();
    
    const { success, page, browser: loginBrowser } = await loginFPG(false);
    browser = loginBrowser;
    
    if (success) {
      const automation = new FPGAutomation(page);
      await automation.run({
        caseNumber: '12345',
        useDate: false,
        isHeadless: false
      });
    }
  } finally {
    await cleanup(browser);
  }
}
```

### CAPTCHA Solving Example

```javascript
import { solveCaptcha } from './captchaSolver.js';
import { takeScreenshot } from './utils.js';

async function solveCaptchaExample(page) {
  // Take screenshot for debugging
  await takeScreenshot(page, 'before-captcha');
  
  // Get CAPTCHA image
  const captchaElement = await page.$('img[alt="驗證碼"]');
  const imageBuffer = await captchaElement.screenshot();
  
  // Solve CAPTCHA
  const captchaText = await solveCaptcha(imageBuffer);
  
  if (captchaText !== 'error') {
    await page.type('#captcha-input', captchaText);
    console.log('CAPTCHA solved:', captchaText);
  } else {
    console.error('Failed to solve CAPTCHA');
  }
}
```

### Error Handling with Retry

```javascript
import { retryOperation, handleError } from './utils.js';

async function robustOperation(page) {
  try {
    await retryOperation(async () => {
      await page.click('#submit-button');
      await page.waitForSelector('#success-message', { timeout: 5000 });
    }, 3);
    
    console.log('Operation completed successfully');
  } catch (error) {
    await handleError(page, 'submit operation', error);
  }
}
```

## Error Handling

### Built-in Error Handling

The framework provides comprehensive error handling:

- **Automatic retries** for transient failures
- **Screenshot capture** on errors
- **Graceful degradation** for non-critical failures
- **Resource cleanup** in finally blocks

### Custom Error Handling

```javascript
import { handleError, takeScreenshot } from './utils.js';

async function customErrorHandling(page) {
  try {
    // Risky operation
    await page.click('#dangerous-button');
  } catch (error) {
    // Built-in error handler with screenshot
    await handleError(page, 'dangerous operation', error);
    
    // Custom recovery logic
    await page.reload();
    await takeScreenshot(page, 'after-recovery');
  }
}
```

## Types & Interfaces

### AutomationOptions

```typescript
interface AutomationOptions {
  caseNumber?: string;      // Optional case number
  useDate: boolean;         // Use date-based search
  startDate: string;        // Start date (YYYY-MM-DD)
  endDate: string;          // End date (YYYY-MM-DD)
  isHeadless: boolean;      // Headless browser mode
}
```

### LoginResult

```typescript
interface LoginResult {
  success: boolean;         // Login success status
  page: Page;              // Puppeteer page instance
  browser: Browser;        // Puppeteer browser instance
}
```

### SearchResult

```typescript
interface SearchResult {
  success: boolean;         // Search success status
  message?: string;         // Error message if failed
  data?: any;              // Search result data
}
```

---

## Contributing

When extending the API, ensure to:

1. Follow existing naming conventions
2. Add comprehensive JSDoc comments
3. Include error handling
4. Update this documentation
5. Add usage examples

## License

ISC License - see package.json for details.