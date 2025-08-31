# FPG Automation - Usage Guide

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd fpg-automation

# Install dependencies
npm install
```

### 2. Configuration Setup

Create your configuration file:

```bash
cp config.example.js config.js
```

Edit `config.js` with your credentials:

```javascript
export default {
  azureEndpoint: 'https://your-region.cognitiveservices.azure.com/',
  azureApiKey: 'your-azure-api-key',
  loginUrl: 'https://your-target-site.com/login',
  username: 'your-username',
  password: 'your-password',
  headless: false
};
```

### 3. Basic Usage

Run the automation with default settings:

```bash
npm start
```

Run in headless mode:

```bash
npm run start:headless
```

## Common Use Cases

### Case 1: Search by Date Range

```javascript
import { runAutomation } from './fpgAutomation.js';

const options = {
  caseNumber: '',           // Empty for date-based search
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
};

await runAutomation(options);
```

### Case 2: Search by Specific Case Number

```javascript
import { runAutomation } from './fpgAutomation.js';

const options = {
  caseNumber: '12345',      // Specific case number
  useDate: false,           // Disable date search
  startDate: '',
  endDate: '',
  isHeadless: false
};

await runAutomation(options);
```

### Case 3: Combined Search (Case Number + Date Range)

```javascript
import { runAutomation } from './fpgAutomation.js';

const options = {
  caseNumber: '12345',
  useDate: true,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  isHeadless: false
};

await runAutomation(options);
```

## Advanced Usage

### Custom Browser Configuration

```javascript
import { loginFPG, closeBrowser } from './browserSetup.js';
import { FPGAutomation } from './fpgAutomation.js';
import { initializeEnvironment, cleanup } from './utils.js';

async function customBrowserSetup() {
  let browser = null;
  try {
    await initializeEnvironment();
    
    // Custom browser options
    const { success, page, browser: loginBrowser } = await loginFPG(false);
    browser = loginBrowser;
    
    if (success) {
      // Set custom viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const automation = new FPGAutomation(page);
      await automation.run({
        caseNumber: '12345',
        useDate: true,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        isHeadless: false
      });
    }
  } finally {
    await cleanup(browser);
  }
}
```

### Manual Step-by-Step Automation

```javascript
import { loginFPG } from './browserSetup.js';
import { 
  clickElementByText, 
  takeScreenshot, 
  waitForSelector,
  inputCaseNumber 
} from './utils.js';

async function manualAutomation() {
  const { success, page, browser } = await loginFPG(false);
  
  if (success) {
    try {
      // Step 1: Navigate to sale bulletin
      await clickElementByText(page, '.menu_pos a', '標售公報');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await takeScreenshot(page, 'sale-bulletin-page');
      
      // Step 2: Input search criteria
      await inputCaseNumber(page, '12345');
      await takeScreenshot(page, 'after-input');
      
      // Step 3: Submit search
      await page.click('#search-button');
      await waitForSelector(page, '.search-results');
      await takeScreenshot(page, 'search-results');
      
      console.log('Manual automation completed');
    } catch (error) {
      console.error('Manual automation failed:', error);
      await takeScreenshot(page, 'error-state');
    } finally {
      await browser.close();
    }
  }
}
```

### Batch Processing Multiple Searches

```javascript
import { runAutomation } from './fpgAutomation.js';
import { wait } from './utils.js';

async function batchProcessing() {
  const searches = [
    { caseNumber: '12345', useDate: false },
    { caseNumber: '67890', useDate: false },
    { 
      caseNumber: '', 
      useDate: true, 
      startDate: '2024-01-01', 
      endDate: '2024-01-31' 
    }
  ];
  
  for (const [index, searchOptions] of searches.entries()) {
    console.log(`Processing search ${index + 1}/${searches.length}`);
    
    try {
      await runAutomation({
        ...searchOptions,
        isHeadless: true // Use headless for batch processing
      });
      
      console.log(`Search ${index + 1} completed successfully`);
      
      // Wait between searches to avoid rate limiting
      if (index < searches.length - 1) {
        await wait(5000);
      }
    } catch (error) {
      console.error(`Search ${index + 1} failed:`, error);
    }
  }
}
```

## Environment Variables

You can use environment variables instead of a config file:

```bash
export AZURE_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
export AZURE_API_KEY="your-azure-api-key"
export LOGIN_URL="https://your-target-site.com/login"
export FPG_USERNAME="your-username"
export FPG_PASSWORD="your-password"
export HEADLESS="true"

npm start
```

### Docker Environment

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV HEADLESS=true
ENV GITHUB_ACTIONS=true

CMD ["npm", "start"]
```

```bash
# Build and run with Docker
docker build -t fpg-automation .
docker run -e AZURE_ENDPOINT="..." -e AZURE_API_KEY="..." fpg-automation
```

## Debugging and Troubleshooting

### Enable Debug Mode

```javascript
import { runAutomation } from './fpgAutomation.js';

const options = {
  caseNumber: '12345',
  useDate: false,
  isHeadless: false,  // Set to false for visual debugging
  debug: true         // Enable debug mode (if implemented)
};

await runAutomation(options);
```

### Screenshot Debugging

The framework automatically takes screenshots at key points. Screenshots are saved in the `screenshots/` directory with timestamps.

```javascript
import { takeScreenshot } from './utils.js';

// Manual screenshot for debugging
await takeScreenshot(page, 'debug-checkpoint-1');
```

### Common Issues and Solutions

#### 1. CAPTCHA Solving Fails

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

// Retry CAPTCHA solving with cleanup
async function retryCaptcha(page) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await cleanupTempFiles(); // Clean previous attempts
      
      const captchaElement = await page.$('img[alt="驗證碼"]');
      const imageBuffer = await captchaElement.screenshot();
      const result = await solveCaptcha(imageBuffer);
      
      if (result !== 'error') {
        return result;
      }
      
      console.log(`CAPTCHA attempt ${attempt} failed, retrying...`);
      
      // Refresh CAPTCHA
      await page.click('#refresh-captcha');
      await wait(1000);
    } catch (error) {
      console.error(`CAPTCHA attempt ${attempt} error:`, error);
    }
  }
  
  throw new Error('Failed to solve CAPTCHA after 3 attempts');
}
```

#### 2. Element Not Found

```javascript
import { waitForSelector, retryOperation } from './utils.js';

// Robust element interaction
async function robustClick(page, selector) {
  await retryOperation(async () => {
    await waitForSelector(page, selector, { timeout: 10000 });
    await page.click(selector);
  }, 3);
}
```

#### 3. Network Timeouts

```javascript
// Increase timeouts for slow networks
const options = {
  caseNumber: '12345',
  useDate: false,
  isHeadless: false,
  timeout: 60000  // 60 second timeout
};

// Or set page timeout manually
await page.setDefaultNavigationTimeout(60000);
await page.setDefaultTimeout(30000);
```

## Performance Optimization

### Headless Mode for Production

```javascript
const options = {
  caseNumber: '12345',
  useDate: false,
  isHeadless: true  // Faster execution
};
```

### Batch Processing with Concurrency

```javascript
import { runAutomation } from './fpgAutomation.js';

async function concurrentProcessing() {
  const searches = [
    { caseNumber: '12345' },
    { caseNumber: '67890' },
    { caseNumber: '11111' }
  ];
  
  // Process 2 searches concurrently
  const results = [];
  for (let i = 0; i < searches.length; i += 2) {
    const batch = searches.slice(i, i + 2);
    const batchPromises = batch.map(search => 
      runAutomation({ ...search, isHeadless: true })
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
```

## Integration Examples

### GitHub Actions

```yaml
# .github/workflows/automation.yml
name: FPG Automation

on:
  schedule:
    - cron: '0 9 * * 1-5'  # Run weekdays at 9 AM
  workflow_dispatch:

jobs:
  automation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run automation
      env:
        AZURE_ENDPOINT: ${{ secrets.AZURE_ENDPOINT }}
        AZURE_API_KEY: ${{ secrets.AZURE_API_KEY }}
        LOGIN_URL: ${{ secrets.LOGIN_URL }}
        FPG_USERNAME: ${{ secrets.FPG_USERNAME }}
        FPG_PASSWORD: ${{ secrets.FPG_PASSWORD }}
        HEADLESS: 'true'
      run: npm run start:headless
```

### Cron Job

```bash
# Add to crontab (crontab -e)
0 9 * * 1-5 cd /path/to/fpg-automation && npm start >> /var/log/fpg-automation.log 2>&1
```

### Web API Integration

```javascript
import express from 'express';
import { runAutomation } from './fpgAutomation.js';

const app = express();
app.use(express.json());

app.post('/api/search', async (req, res) => {
  try {
    const { caseNumber, useDate, startDate, endDate } = req.body;
    
    const options = {
      caseNumber,
      useDate,
      startDate,
      endDate,
      isHeadless: true
    };
    
    await runAutomation(options);
    
    res.json({ success: true, message: 'Automation completed' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(3000, () => {
  console.log('FPG Automation API running on port 3000');
});
```

## Monitoring and Logging

### Custom Logging

```javascript
import fs from 'fs';
import { runAutomation } from './fpgAutomation.js';

function createLogger(filename) {
  return {
    log: (message) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(filename, logEntry);
      console.log(message);
    },
    error: (message) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ERROR: ${message}\n`;
      fs.appendFileSync(filename, logEntry);
      console.error(message);
    }
  };
}

async function automationWithLogging() {
  const logger = createLogger('automation.log');
  
  try {
    logger.log('Starting automation...');
    
    await runAutomation({
      caseNumber: '12345',
      useDate: false,
      isHeadless: true
    });
    
    logger.log('Automation completed successfully');
  } catch (error) {
    logger.error(`Automation failed: ${error.message}`);
    throw error;
  }
}
```

## Security Best Practices

### Credential Management

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Rotate credentials** regularly
4. **Use least privilege** principle for API keys

### Safe Configuration

```javascript
// config.js - Safe configuration pattern
export default {
  azureEndpoint: process.env.AZURE_ENDPOINT || (() => {
    throw new Error('AZURE_ENDPOINT environment variable is required');
  })(),
  azureApiKey: process.env.AZURE_API_KEY || (() => {
    throw new Error('AZURE_API_KEY environment variable is required');
  })(),
  // ... other required configs
};
```

### Network Security

```javascript
// Use HTTPS only
const config = {
  loginUrl: process.env.LOGIN_URL,
  // Validate URL is HTTPS
  validateUrl: (url) => {
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs are allowed');
    }
  }
};
```

---

This usage guide covers the most common scenarios and best practices for using the FPG Automation framework. For detailed API reference, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).