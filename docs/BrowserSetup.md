# BrowserSetup Module Documentation

## Overview

The `browserSetup.js` module handles all browser-related operations including browser launching, page setup, navigation, and the complete login workflow with CAPTCHA solving capabilities.

## Exports

```javascript
export { loginFPG, closeBrowser };
```

## Public Functions

### `async loginFPG(isHeadless = false)`

Performs the complete automated login workflow to the FPG system.

**Parameters:**
- `isHeadless` (boolean, optional): Whether to run browser in headless mode. Default: false

**Returns:** `Promise<Object>`
- `success` (boolean): Login success status
- `page` (Page): Puppeteer page instance (if successful)
- `browser` (Browser): Puppeteer browser instance

**Workflow:**
1. Launches browser with appropriate configuration
2. Sets up new page with navigation timeout
3. Navigates to login URL
4. Attempts login with CAPTCHA solving (up to MAX_LOGIN_ATTEMPTS)
5. Validates login success
6. Returns result object

**Example:**
```javascript
import { loginFPG } from './browserSetup.js';

const { success, page, browser } = await loginFPG(false);
if (success) {
  console.log('Login successful, ready for automation');
  // Use page for further automation
} else {
  console.log('Login failed');
  await browser.close();
}
```

**Error Handling:**
- Catches and logs all login errors
- Returns failure status on any error
- Ensures browser cleanup on failure

### `async closeBrowser(browser)`

Safely closes the browser instance with error handling.

**Parameters:**
- `browser` (Browser): Puppeteer browser instance to close

**Returns:** `Promise<void>`

**Behavior:**
- Attempts to close browser gracefully
- Logs closure confirmation
- Handles and logs closure errors
- Never throws exceptions

**Example:**
```javascript
import { closeBrowser } from './browserSetup.js';

// After automation is complete
await closeBrowser(browser);
```

## Internal Functions

### Browser Configuration

#### `findChromePath()`

Determines the appropriate Chrome executable path based on the operating system.

**Returns:** `string|null` - Chrome executable path or null if not found

**Supported Platforms:**
- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Windows**: `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- **Linux**: `/usr/bin/google-chrome`

**Example Usage:**
```javascript
const chromePath = findChromePath();
if (chromePath) {
  console.log(`Using Chrome at: ${chromePath}`);
}
```

#### `async launchBrowser()`

Launches a Puppeteer browser instance with configured options.

**Returns:** `Promise<Browser>` - Configured Puppeteer browser instance

**Configuration:**
- Uses `getBrowserOptions()` for configuration
- Logs browser options for debugging
- Applies platform-specific settings

#### `getBrowserOptions()`

Generates browser launch options based on environment and configuration.

**Returns:** `Object` - Puppeteer launch options

**Options:**
- `headless`: Based on config.headless setting ('new' or false)
- `args`: Security and sandbox settings
- `defaultViewport`: null (uses system default)
- `timeout`: 30 seconds
- `executablePath`: Chrome path (if not in GitHub Actions)

**Environment Handling:**
- **GitHub Actions**: Uses default Puppeteer browser
- **Local Development**: Attempts to find system Chrome installation
- **Docker/CI**: Configures appropriate sandbox settings

**Example Configuration:**
```javascript
{
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: null,
  timeout: 30000,
  executablePath: '/usr/bin/google-chrome'
}
```

### Page Management

#### `async setupPage(browser)`

Creates and configures a new page with appropriate settings.

**Parameters:**
- `browser` (Browser): Puppeteer browser instance

**Returns:** `Promise<Page>` - Configured page instance

**Configuration:**
- Sets navigation timeout to 60 seconds
- Prepares page for automation tasks

#### `async navigateToLoginPage(page)`

Navigates to the login URL specified in configuration.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<void>`

**Behavior:**
- Navigates to `config.loginUrl`
- Waits for page load completion
- Logs navigation success

### Login Workflow

#### `async attemptLogin(page)`

Performs a single login attempt with CAPTCHA solving.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<boolean>` - Login attempt success status

**Workflow:**
1. Gets CAPTCHA image buffer
2. Solves CAPTCHA using Azure Computer Vision
3. Fills login form with credentials and CAPTCHA
4. Submits form
5. Checks for login success

**CAPTCHA Handling:**
- Automatically refreshes CAPTCHA on solve failure
- Retries CAPTCHA solving if needed
- Falls back gracefully on CAPTCHA errors

#### `async fillLoginForm(page, captchaText)`

Fills the login form with username, password, and CAPTCHA text.

**Parameters:**
- `page` (Page): Puppeteer page instance
- `captchaText` (string): Solved CAPTCHA text

**Returns:** `Promise<void>`

**Form Fields:**
- Username: `config.username`
- Password: `config.password`
- CAPTCHA: Provided captchaText

**Error Handling:**
- Logs form filling errors
- Continues execution on non-critical errors

#### `async submitLoginForm(page)`

Submits the login form and waits for response.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<void>`

**Behavior:**
- Clicks submit button
- Waits for navigation or page response
- Handles submission timeouts

#### `async checkLoginSuccess(page)`

Validates whether login was successful by checking page content.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<boolean>` - Login validation result

**Validation Logic:**
- Checks for success indicators in page content
- Looks for expected post-login elements
- Validates URL changes
- Takes screenshot for verification

### CAPTCHA Management

#### `async getCaptchaImageBuffer(page)`

Extracts CAPTCHA image as a buffer for processing.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<Buffer>` - CAPTCHA image buffer

**Behavior:**
- Locates CAPTCHA image element
- Captures screenshot of CAPTCHA area
- Returns buffer for CAPTCHA solving

#### `async refreshCaptcha(page)`

Refreshes the CAPTCHA image when solving fails.

**Parameters:**
- `page` (Page): Puppeteer page instance

**Returns:** `Promise<void>`

**Behavior:**
- Clicks CAPTCHA refresh button/link
- Waits for new CAPTCHA to load
- Includes delay for CAPTCHA generation

## Constants

### `MAX_LOGIN_ATTEMPTS`
Maximum number of login attempts before giving up.
```javascript
const MAX_LOGIN_ATTEMPTS = 5;
```

### `CAPTCHA_REFRESH_DELAY`
Delay in milliseconds after refreshing CAPTCHA.
```javascript
const CAPTCHA_REFRESH_DELAY = 1000;
```

## Configuration Dependencies

The module depends on the following configuration values:

```javascript
{
  headless: boolean,        // Browser headless mode
  loginUrl: string,         // Target login URL
  username: string,         // Login username
  password: string,         // Login password
  azureEndpoint: string,    // Azure Computer Vision endpoint
  azureApiKey: string       // Azure API key
}
```

## Usage Patterns

### Basic Login

```javascript
import { loginFPG, closeBrowser } from './browserSetup.js';

const { success, page, browser } = await loginFPG(false);
try {
  if (success) {
    // Perform automation tasks
    await page.goto('https://target-site.com/dashboard');
    // ... automation logic
  }
} finally {
  await closeBrowser(browser);
}
```

### Headless Production Login

```javascript
import { loginFPG, closeBrowser } from './browserSetup.js';

const { success, page, browser } = await loginFPG(true);
if (success) {
  console.log('Headless login successful');
  // Continue with automated tasks
}
```

### Error Handling Pattern

```javascript
import { loginFPG, closeBrowser } from './browserSetup.js';

try {
  const { success, page, browser } = await loginFPG(false);
  
  if (!success) {
    console.error('Login failed - check credentials and network');
    await closeBrowser(browser);
    return;
  }
  
  // Successful login - continue automation
  
} catch (error) {
  console.error('Browser setup failed:', error);
  // Handle critical errors
}
```

### Custom Browser Configuration

```javascript
// For advanced users who need custom browser settings
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080'
  ],
  defaultViewport: { width: 1920, height: 1080 }
});

// Then use with existing functions...
```

## Environment Considerations

### GitHub Actions / CI

```javascript
// Automatically detected environment
if (process.env.GITHUB_ACTIONS === 'true') {
  // Uses Puppeteer's bundled Chromium
  // Enables appropriate CI-specific settings
}
```

### Docker Deployment

```dockerfile
# Dockerfile considerations
RUN apt-get update && apt-get install -y \
    chromium-browser \
    --no-install-recommends

ENV CHROME_PATH=/usr/bin/chromium-browser
ENV HEADLESS=true
```

### Local Development

```bash
# Environment variables for local testing
export HEADLESS=false
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## Troubleshooting

### Common Issues

1. **Chrome Not Found**
   - Ensure Chrome is installed
   - Set CHROME_PATH environment variable
   - Check platform-specific paths

2. **CAPTCHA Solving Fails**
   - Verify Azure credentials
   - Check network connectivity
   - Monitor Azure API quotas

3. **Login Timeout**
   - Increase navigation timeout
   - Check network speed
   - Verify login URL accessibility

4. **Headless Mode Issues**
   - Some sites block headless browsers
   - Try with headless: false for debugging
   - Check for anti-bot measures

### Debug Mode

```javascript
// Enable verbose logging
const { success, page, browser } = await loginFPG(false);

// Take screenshots for debugging
await page.screenshot({ path: 'debug-login.png', fullPage: true });

// Log page content for analysis
const content = await page.content();
console.log('Page content:', content);
```

## Dependencies

- **puppeteer**: Browser automation
- **./utils.js**: `takeScreenshot`, `wait` utility functions
- **./captchaSolver.js**: `solveCaptcha` function
- **./configLoader.js**: Configuration management

## Security Considerations

- Credentials are loaded from secure configuration
- Browser runs with restricted permissions
- CAPTCHA images are processed securely
- Temporary files are cleaned up automatically
- Network requests are logged for audit purposes