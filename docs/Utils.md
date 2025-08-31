# Utils Module Documentation

## Overview

The `utils.js` module provides a comprehensive collection of utility functions for DOM interaction, page navigation, error handling, screenshot management, and various automation helpers. This module serves as the foundation for all browser automation tasks.

## Exports

```javascript
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
  waitForPopupSelector,
  waitForSelectorWithTimeout,
  waitForPopupClosed,
  goToSpecificPage,
  retryOperation,
  handleError,
  validateSearchCriteria,
  retryWithTimeout,
};
```

## DOM Interaction Functions

### `async clickElementByText(page, selector, text)`

Finds and clicks an element containing specific text content.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `selector` (string): CSS selector to search within
- `text` (string): Text content to match (case-sensitive)

**Returns:** `Promise<void>`

**Behavior:**
- Searches for elements matching the selector
- Finds element containing exact text match
- Clicks the matching element
- Throws error if no matching element found

**Example:**
```javascript
import { clickElementByText } from './utils.js';

// Click a menu item
await clickElementByText(page, '.menu a', '標售公報');

// Click a button with specific text
await clickElementByText(page, 'button', 'Submit');

// Click table cell containing specific text
await clickElementByText(page, 'td', 'View Details');
```

### `async waitForSelector(page, selector, options = {})`

Waits for an element to appear on the page with configurable options.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `selector` (string): CSS selector to wait for
- `options` (Object, optional): Wait configuration
  - `timeout` (number): Maximum wait time in milliseconds
  - `visible` (boolean): Wait for element to be visible
  - `hidden` (boolean): Wait for element to be hidden

**Returns:** `Promise<ElementHandle|null>`

**Example:**
```javascript
import { waitForSelector } from './utils.js';

// Basic wait for element
await waitForSelector(page, '#submit-button');

// Wait with timeout
await waitForSelector(page, '.loading-spinner', { timeout: 10000 });

// Wait for visible element
await waitForSelector(page, '#modal', { visible: true });
```

### `async waitForSelectorWithTimeout(page, selector, timeout = 10000)`

Simplified version of waitForSelector with default timeout.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `selector` (string): CSS selector to wait for
- `timeout` (number, optional): Timeout in milliseconds. Default: 10000

**Returns:** `Promise<ElementHandle>`

**Example:**
```javascript
import { waitForSelectorWithTimeout } from './utils.js';

// Wait for element with custom timeout
const element = await waitForSelectorWithTimeout(page, '#data-table', 15000);
```

### `async waitForPopupSelector(popup, selector, options = {})`

Waits for an element to appear within a popup window.

**Parameters:**
- `popup` (Page): Puppeteer popup page instance
- `selector` (string): CSS selector to wait for
- `options` (Object, optional): Wait options

**Returns:** `Promise<ElementHandle>`

**Example:**
```javascript
import { waitForPopupSelector } from './utils.js';

// Handle popup window
page.on('popup', async popup => {
  await waitForPopupSelector(popup, '#popup-content');
  // Interact with popup elements
});
```

### `async waitForPopupClosed(popup)`

Waits for a popup window to close.

**Parameters:**
- `popup` (Page): Puppeteer popup page instance

**Returns:** `Promise<void>`

**Example:**
```javascript
import { waitForPopupClosed } from './utils.js';

const popup = await new Promise(resolve => page.once('popup', resolve));
// ... interact with popup
await waitForPopupClosed(popup);
console.log('Popup closed');
```

## Form Input Functions

### `async inputCaseNumber(page, caseNumber)`

Inputs a case number into the designated form field with proper radio button selection.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `caseNumber` (string): Case number to input

**Returns:** `Promise<void>`

**Behavior:**
1. Clicks the case number radio button (`radio1`)
2. Clears the case number input field
3. Types the provided case number
4. Logs the input action

**Example:**
```javascript
import { inputCaseNumber } from './utils.js';

await inputCaseNumber(page, '12345');
await inputCaseNumber(page, 'ABC-2024-001');
```

### `async pressESC(page)`

Sends an ESC key press to the page, useful for closing dialogs or canceling operations.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<void>`

**Example:**
```javascript
import { pressESC } from './utils.js';

// Close modal or dialog
await pressESC(page);

// Cancel current operation
await pressESC(page);
```

## Dialog Handling

### `async handleDialog(page, action, timeout = 5000)`

Handles browser dialogs (alerts, confirms, prompts) with configurable actions.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `action` (string): Action to take ('accept', 'dismiss', or text for prompts)
- `timeout` (number, optional): Timeout in milliseconds. Default: 5000

**Returns:** `Promise<string|null>` - Dialog message or null if no dialog

**Supported Actions:**
- `'accept'`: Accept/OK the dialog
- `'dismiss'`: Cancel/dismiss the dialog
- Any string: Enter text in prompt dialog then accept

**Example:**
```javascript
import { handleDialog } from './utils.js';

// Accept an alert
await handleDialog(page, 'accept');

// Dismiss a confirmation
await handleDialog(page, 'dismiss');

// Enter text in a prompt
await handleDialog(page, 'Hello World');

// Handle with custom timeout
await handleDialog(page, 'accept', 10000);
```

**Dialog Types Supported:**
- `alert`: Information messages
- `confirm`: Yes/No confirmations
- `prompt`: Text input dialogs
- `beforeunload`: Page navigation confirmations

## Navigation Functions

### `async navigateToNextPage(page)`

Navigates to the next page in paginated results.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<boolean>` - Success status

**Behavior:**
- Looks for "下一頁" (Next Page) link
- Clicks the link if found
- Waits for navigation to complete
- Returns false if no next page available

**Example:**
```javascript
import { navigateToNextPage } from './utils.js';

let hasNextPage = true;
while (hasNextPage) {
  // Process current page data
  await processCurrentPage(page);
  
  // Try to go to next page
  hasNextPage = await navigateToNextPage(page);
}
```

### `async goToSpecificPage(page, pageNumber)`

Navigates directly to a specific page number in paginated results.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `pageNumber` (number): Target page number

**Returns:** `Promise<boolean>` - Navigation success status

**Example:**
```javascript
import { goToSpecificPage } from './utils.js';

// Go to page 5
const success = await goToSpecificPage(page, 5);
if (success) {
  console.log('Successfully navigated to page 5');
}
```

### `isLastPage(currentPage, totalPages)`

Determines if the current page is the last page in pagination.

**Parameters:**
- `currentPage` (number): Current page number
- `totalPages` (number): Total number of pages

**Returns:** `boolean` - True if on last page

**Example:**
```javascript
import { isLastPage } from './utils.js';

const current = 5;
const total = 10;
if (isLastPage(current, total)) {
  console.log('This is the last page');
} else {
  console.log(`${total - current} pages remaining`);
}
```

## Screenshot Management

### `async takeScreenshot(page, name)`

Captures a screenshot of the current page with timestamp.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `name` (string): Base filename for the screenshot

**Returns:** `Promise<void>`

**Behavior:**
- Creates screenshot in `screenshots/` directory
- Adds timestamp to filename for uniqueness
- Ensures screenshots directory exists
- Logs screenshot location

**Example:**
```javascript
import { takeScreenshot } from './utils.js';

// Take screenshot at key points
await takeScreenshot(page, 'login-page');
await takeScreenshot(page, 'search-results');
await takeScreenshot(page, 'error-state');
```

**File Naming:**
- Input: `'login-page'`
- Output: `screenshots/login-page_1640995200000.png`

## Environment Management

### `async initializeEnvironment()`

Initializes the automation environment by setting up required directories.

**Returns:** `Promise<void>`

**Behavior:**
- Clears existing screenshots folder
- Creates fresh screenshots directory
- Logs initialization status

**Example:**
```javascript
import { initializeEnvironment } from './utils.js';

// Call at start of automation
await initializeEnvironment();
```

### `async cleanup(browser)`

Performs cleanup operations including browser closure and temporary file removal.

**Parameters:**
- `browser` (Browser): Puppeteer browser instance to clean up

**Returns:** `Promise<void>`

**Cleanup Tasks:**
- Closes browser if provided
- Cleans up CAPTCHA temporary files
- Logs cleanup completion

**Example:**
```javascript
import { cleanup } from './utils.js';

let browser = null;
try {
  browser = await puppeteer.launch();
  // ... automation tasks
} finally {
  await cleanup(browser);
}
```

## Error Handling and Retry Logic

### `async retryOperation(operation, maxRetries = 3)`

Executes an operation with retry logic and exponential backoff.

**Parameters:**
- `operation` (Function): Async function to retry
- `maxRetries` (number, optional): Maximum retry attempts. Default: 3

**Returns:** `Promise<any>` - Result of successful operation

**Retry Strategy:**
- Exponential backoff: 1s, 2s, 4s delays
- Logs each retry attempt
- Throws last error if all retries fail

**Example:**
```javascript
import { retryOperation } from './utils.js';

// Retry unreliable operation
const result = await retryOperation(async () => {
  await page.click('#flaky-button');
  await page.waitForSelector('#success', { timeout: 5000 });
  return await page.$eval('#result', el => el.textContent);
}, 3);

// Retry with custom logic
const data = await retryOperation(async () => {
  const response = await page.evaluate(() => fetch('/api/data'));
  if (!response.ok) throw new Error('API call failed');
  return response.json();
});
```

### `async retryWithTimeout(operation, maxRetries = 3, timeout = 30000)`

Executes an operation with both retry logic and overall timeout.

**Parameters:**
- `operation` (Function): Async function to retry
- `maxRetries` (number, optional): Maximum retry attempts. Default: 3
- `timeout` (number, optional): Overall timeout in milliseconds. Default: 30000

**Returns:** `Promise<any>` - Result of successful operation

**Example:**
```javascript
import { retryWithTimeout } from './utils.js';

// Retry with overall timeout
const result = await retryWithTimeout(async () => {
  return await performComplexOperation(page);
}, 5, 60000); // 5 retries, 60 second total timeout
```

### `async handleError(page, operation, error)`

Standardized error handling with screenshot capture and logging.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `operation` (string): Description of failed operation
- `error` (Error): The error that occurred

**Returns:** `Promise<void>`

**Error Handling:**
- Logs detailed error information
- Captures screenshot for debugging
- Includes operation context in logs

**Example:**
```javascript
import { handleError } from './utils.js';

try {
  await page.click('#submit-button');
} catch (error) {
  await handleError(page, 'clicking submit button', error);
  // Continue with error recovery logic
}
```

## Validation Functions

### `validateSearchCriteria(caseNumber, useDate)`

Validates search criteria to ensure at least one search method is specified.

**Parameters:**
- `caseNumber` (string): Case number to validate
- `useDate` (boolean): Whether date-based search is enabled

**Returns:** `boolean` - Validation result

**Validation Logic:**
- Returns true if caseNumber is provided (non-empty string)
- Returns true if useDate is true
- Returns false if both are empty/false
- Logs validation results

**Example:**
```javascript
import { validateSearchCriteria } from './utils.js';

// Valid scenarios
console.log(validateSearchCriteria('12345', false)); // true
console.log(validateSearchCriteria('', true)); // true
console.log(validateSearchCriteria('ABC', true)); // true

// Invalid scenario
console.log(validateSearchCriteria('', false)); // false
```

## Utility Functions

### `wait(ms)`

Pauses execution for specified milliseconds.

**Parameters:**
- `ms` (number): Milliseconds to wait

**Returns:** `Promise<void>`

**Example:**
```javascript
import { wait } from './utils.js';

// Wait 2 seconds
await wait(2000);

// Wait between operations
await page.click('#button1');
await wait(1000);
await page.click('#button2');
```

### `getTodayDate()`

Gets the current date in YYYY-MM-DD format.

**Returns:** `string` - Today's date

**Example:**
```javascript
import { getTodayDate } from './utils.js';

const today = getTodayDate();
console.log(today); // "2024-01-15"

// Use in automation
const options = {
  startDate: today,
  endDate: today
};
```

### `isValidCaseNumber(caseNumber)`

Validates case number format and content.

**Parameters:**
- `caseNumber` (string): Case number to validate

**Returns:** `boolean` - Validation result

**Validation Rules:**
- Must be non-empty string
- Must contain alphanumeric characters
- Trims whitespace before validation

**Example:**
```javascript
import { isValidCaseNumber } from './utils.js';

console.log(isValidCaseNumber('12345')); // true
console.log(isValidCaseNumber('ABC-123')); // true
console.log(isValidCaseNumber('')); // false
console.log(isValidCaseNumber('   ')); // false
```

## Constants and Configuration

### Selectors

```javascript
const SELECTORS = {
  CASE_NUMBER_RADIO: 'input[type="radio"][value="radio1"]',
  CASE_NUMBER_INPUT: 'input[name="tndsalno"]',
};
```

### Directory Paths

```javascript
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
```

## Usage Patterns

### Basic Page Interaction

```javascript
import { 
  waitForSelector, 
  clickElementByText, 
  takeScreenshot 
} from './utils.js';

// Wait for page to load
await waitForSelector(page, '.main-content');

// Interact with elements
await clickElementByText(page, '.menu a', 'Home');

// Capture state
await takeScreenshot(page, 'after-navigation');
```

### Error Handling Pattern

```javascript
import { 
  retryOperation, 
  handleError, 
  takeScreenshot 
} from './utils.js';

try {
  await retryOperation(async () => {
    await page.click('#unreliable-button');
    await waitForSelector(page, '#success-indicator');
  });
} catch (error) {
  await handleError(page, 'button interaction', error);
}
```

### Form Automation

```javascript
import { 
  inputCaseNumber, 
  handleDialog, 
  validateSearchCriteria 
} from './utils.js';

const caseNumber = '12345';
const useDate = false;

if (validateSearchCriteria(caseNumber, useDate)) {
  await inputCaseNumber(page, caseNumber);
  await page.click('#search-button');
  await handleDialog(page, 'accept');
}
```

### Pagination Handling

```javascript
import { 
  navigateToNextPage, 
  isLastPage, 
  takeScreenshot 
} from './utils.js';

let currentPage = 1;
const maxPages = 10;

while (currentPage <= maxPages) {
  await takeScreenshot(page, `page-${currentPage}`);
  
  // Process current page data
  await processPageData(page);
  
  // Try to go to next page
  if (!await navigateToNextPage(page)) {
    console.log('Reached last page');
    break;
  }
  
  currentPage++;
}
```

## Dependencies

- **fs/promises**: File system operations
- **path**: Path manipulation
- **url**: URL utilities
- **./captchaSolver.js**: `cleanupTempFiles` function
- **./browserSetup.js**: `closeBrowser` function

## Best Practices

1. **Always use error handling** - Wrap operations in try-catch blocks
2. **Take screenshots** - Capture key states for debugging
3. **Validate inputs** - Use validation functions before operations
4. **Use retries** - Apply retry logic for unreliable operations
5. **Clean up resources** - Always call cleanup functions
6. **Wait for elements** - Use wait functions instead of fixed delays
7. **Handle dialogs** - Set up dialog handlers before triggering actions