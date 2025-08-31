# FPGAutomation Module Documentation

## Overview

The `fpgAutomation.js` module contains the core automation logic and orchestrates the entire workflow. It exports the main `FPGAutomation` class along with utility functions for running automation tasks.

## Exports

```javascript
export { FPGAutomation, runAutomation, main };
```

## Classes

### FPGAutomation

The main automation orchestrator class that coordinates navigation, searching, and result processing.

#### Constructor

```javascript
new FPGAutomation(page)
```

**Parameters:**
- `page` (Page): Puppeteer page instance

**Properties:**
- `page` (Page): The Puppeteer page instance
- `options` (Object): Current automation options
- `navigationManager` (NavigationManager): Handles page navigation
- `searchManager` (SearchManager): Manages search operations
- `resultProcessor` (ResultProcessor): Processes search results

#### Methods

##### `async run(options)`

Executes the complete automation workflow including navigation, search, and result processing.

**Parameters:**
- `options` (Object): Automation configuration
  - `caseNumber` (string, optional): Specific case number to search for
  - `useDate` (boolean): Whether to use date-based search criteria
  - `startDate` (string): Start date in YYYY-MM-DD format
  - `endDate` (string): End date in YYYY-MM-DD format
  - `isHeadless` (boolean): Whether browser runs in headless mode

**Returns:** `Promise<void>`

**Example:**
```javascript
import { FPGAutomation } from './fpgAutomation.js';

const automation = new FPGAutomation(page);
await automation.run({
  caseNumber: '12345',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
});
```

**Workflow:**
1. Updates internal options and result processor
2. Navigates to sale bulletin page via NavigationManager
3. Performs search via SearchManager
4. Processes results if search successful via ResultProcessor

### NavigationManager

Handles all page navigation and UI interactions.

#### Constructor

```javascript
new NavigationManager(page)
```

**Parameters:**
- `page` (Page): Puppeteer page instance

#### Methods

##### `async navigateToSaleBulletin()`

Navigates to the sale bulletin (標售公報) page from the main menu.

**Returns:** `Promise<boolean>` - Success status

**Behavior:**
- Clicks the "標售公報" menu item
- Waits for page navigation to complete
- Takes screenshot for verification
- Handles navigation errors gracefully

**Example:**
```javascript
const navManager = new NavigationManager(page);
const success = await navManager.navigateToSaleBulletin();
if (success) {
  console.log('Successfully navigated to sale bulletin');
}
```

##### `async clickBackToMainButton()`

Navigates back to the main page using the "回主畫面" button.

**Returns:** `Promise<void>`

**Behavior:**
- Clicks the back to main screen button
- Handles click errors with error reporting

**Example:**
```javascript
await navManager.clickBackToMainButton();
```

### SearchManager

Manages all search-related operations including form input and result validation.

#### Constructor

```javascript
new SearchManager(page)
```

**Parameters:**
- `page` (Page): Puppeteer page instance

#### Methods

##### `async performSearch(options)`

Performs the complete search operation based on provided criteria.

**Parameters:**
- `options` (Object): Search options
  - `caseNumber` (string, optional): Case number to search for
  - `useDate` (boolean): Whether to use date range search
  - `startDate` (string): Start date for search
  - `endDate` (string): End date for search

**Returns:** `Promise<boolean>` - Search success status

**Workflow:**
1. Validates search criteria
2. Inputs search criteria into form
3. Clicks search button
4. Processes and validates search results

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

##### `async inputSearchCriteria(caseNumber, useDate, startDate, endDate)`

Inputs search criteria into the search form.

**Parameters:**
- `caseNumber` (string): Case number to input
- `useDate` (boolean): Whether to use date range
- `startDate` (string): Start date
- `endDate` (string): End date

**Behavior:**
- Inputs case number if provided
- Configures date range if useDate is true
- Selects announcement date option

##### `async processSearchResults()`

Processes and validates search results after search execution.

**Returns:** `Promise<boolean>` - Result processing success status

**Behavior:**
- Confirms search results are valid
- Logs result status
- Returns success/failure status

##### `async handleSearchError(error)`

Handles errors that occur during search operations.

**Parameters:**
- `error` (Error): The error that occurred

**Returns:** `Promise<boolean>` - Always returns false

**Behavior:**
- Logs error details
- Takes screenshot for debugging
- Returns failure status

### ResultProcessor

Processes search results and handles data extraction.

#### Constructor

```javascript
new ResultProcessor(page, options)
```

**Parameters:**
- `page` (Page): Puppeteer page instance
- `options` (Object): Initial processing options

#### Methods

##### `updateOptions(options)`

Updates the processor options.

**Parameters:**
- `options` (Object): New options to apply

##### `async processResults(options)`

Processes the search results according to the provided options.

**Parameters:**
- `options` (Object): Processing configuration

**Returns:** `Promise<void>`

## Functions

### `async runAutomation(options)`

High-level function that orchestrates the complete automation workflow.

**Parameters:**
- `options` (Object): Automation configuration
  - `caseNumber` (string, optional): Case number to search
  - `useDate` (boolean): Use date-based search
  - `startDate` (string): Start date
  - `endDate` (string): End date
  - `isHeadless` (boolean): Headless browser mode

**Returns:** `Promise<void>`

**Workflow:**
1. Initializes environment
2. Performs login via `loginFPG()`
3. Creates and runs FPGAutomation instance
4. Handles cleanup in finally block

**Example:**
```javascript
import { runAutomation } from './fpgAutomation.js';

await runAutomation({
  caseNumber: '',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
});
```

### `async main()`

Entry point function that sets up default options and runs automation.

**Returns:** `Promise<void>`

**Default Options:**
- `caseNumber`: '' (empty - date-based search)
- `useDate`: true
- `startDate`: Today's date
- `endDate`: Today's date
- `isHeadless`: Based on GITHUB_ACTIONS environment variable

**Example:**
```javascript
import { main } from './fpgAutomation.js';

// Run with default options
await main();
```

## Constants

### SELECTORS

Object containing CSS selectors used throughout the automation:

```javascript
const SELECTORS = {
  SEARCH_RESULT: 'div[align="center"] font[color="#FFFFFF"] b, td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
  SUCCESS_TITLE: 'div[align="center"] font[color="#FFFFFF"] b',
  ERROR_MESSAGE: 'td[bgcolor="#FF9933"] font[color="#FFFFFF"]',
};
```

### MESSAGES

Object containing expected message text for result validation:

```javascript
const MESSAGES = {
  SUCCESS_TITLE: '標售公報查詢清單',
  NOT_FOUND: '找不到您輸入的案號',
};
```

## Error Handling

The module implements comprehensive error handling:

- **Graceful Degradation**: Failed operations don't crash the entire workflow
- **Screenshot Capture**: Automatic screenshots on errors for debugging
- **Resource Cleanup**: Proper cleanup in finally blocks
- **Error Propagation**: Meaningful error messages and logging

## Usage Patterns

### Basic Automation

```javascript
import { runAutomation } from './fpgAutomation.js';

// Simple date-based search
await runAutomation({
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
});
```

### Custom Workflow

```javascript
import { FPGAutomation } from './fpgAutomation.js';
import { loginFPG } from './browserSetup.js';

const { success, page, browser } = await loginFPG(false);
if (success) {
  const automation = new FPGAutomation(page);
  await automation.run({
    caseNumber: '12345',
    useDate: false,
    isHeadless: false
  });
}
```

### Error Handling Pattern

```javascript
try {
  await runAutomation(options);
  console.log('Automation completed successfully');
} catch (error) {
  console.error('Automation failed:', error);
  // Handle error appropriately
}
```

## Dependencies

- `./browserSetup.js`: Browser management and login functionality
- `./utils.js`: Utility functions for DOM interaction and helpers
- Puppeteer: Browser automation (via browserSetup)

## Best Practices

1. **Always use try-catch** when calling automation functions
2. **Provide meaningful options** - validate before passing to functions
3. **Handle cleanup** - ensure browser resources are properly closed
4. **Use headless mode** for production/CI environments
5. **Monitor screenshots** - check the screenshots directory for debugging