# CaptchaSolver Module Documentation

## Overview

The `captchaSolver.js` module provides CAPTCHA recognition capabilities using Microsoft Azure Computer Vision API. It handles image processing, OCR analysis, and text extraction from CAPTCHA images with automatic cleanup of temporary files.

## Exports

```javascript
export { solveCaptcha, cleanupTempFiles };
```

## Public Functions

### `async solveCaptcha(imageBuffer)`

Solves CAPTCHA images using Azure Computer Vision OCR service.

**Parameters:**
- `imageBuffer` (Buffer): Raw image buffer containing the CAPTCHA

**Returns:** `Promise<string>` - Extracted CAPTCHA text or 'error' on failure

**Workflow:**
1. Logs original image metadata
2. Resizes image to optimal dimensions (200x100px)
3. Initiates Azure Computer Vision analysis
4. Waits for analysis completion
5. Retrieves and processes results
6. Returns cleaned CAPTCHA text

**Example:**
```javascript
import { solveCaptcha } from './captchaSolver.js';

// Get CAPTCHA image from page
const captchaElement = await page.$('img[alt="驗證碼"]');
const imageBuffer = await captchaElement.screenshot();

// Solve CAPTCHA
const captchaText = await solveCaptcha(imageBuffer);

if (captchaText !== 'error') {
  console.log('CAPTCHA solved:', captchaText);
  await page.type('#captcha-input', captchaText);
} else {
  console.log('Failed to solve CAPTCHA');
  // Handle CAPTCHA failure (refresh, retry, etc.)
}
```

**Error Handling:**
- Catches all processing errors
- Logs detailed error messages
- Returns 'error' string on any failure
- Never throws exceptions

### `async cleanupTempFiles()`

Removes temporary files created during CAPTCHA processing.

**Returns:** `Promise<void>`

**Behavior:**
- Removes `captcha_original.png`
- Removes `captcha_resized.png`
- Handles file deletion errors gracefully
- Logs cleanup status

**Example:**
```javascript
import { cleanupTempFiles } from './captchaSolver.js';

// Clean up after CAPTCHA processing
await cleanupTempFiles();

// Or use in error handling
try {
  const result = await solveCaptcha(imageBuffer);
} finally {
  await cleanupTempFiles();
}
```

## Internal Functions

### Image Processing

#### `async logOriginalImageMetadata(imageBuffer)`

Logs metadata of the original CAPTCHA image and saves it for debugging.

**Parameters:**
- `imageBuffer` (Buffer): Original image buffer

**Returns:** `Promise<void>`

**Behavior:**
- Extracts image metadata using Sharp
- Saves original image as `captcha_original.png`
- Logs image dimensions and format information

#### `async resizeImage(imageBuffer)`

Resizes CAPTCHA image to optimal dimensions for OCR processing.

**Parameters:**
- `imageBuffer` (Buffer): Original image buffer

**Returns:** `Promise<Buffer>` - Resized image buffer

**Processing:**
- Target dimensions: 200x100 pixels
- Fit mode: 'contain' (maintains aspect ratio)
- Background: White (#FFFFFF)
- Saves resized image as `captcha_resized.png`

**Example Configuration:**
```javascript
const CAPTCHA_DIMENSIONS = { width: 200, height: 100 };

const resizedImageBuffer = await sharp(imageBuffer)
  .resize({
    ...CAPTCHA_DIMENSIONS,
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .toBuffer();
```

### Azure Computer Vision Integration

#### `async initiateCaptchaAnalysis(imageBuffer)`

Initiates OCR analysis with Azure Computer Vision service.

**Parameters:**
- `imageBuffer` (Buffer): Processed image buffer

**Returns:** `Promise<string>` - Operation location URL for result retrieval

**API Configuration:**
- Endpoint: `${config.azureEndpoint}vision/v3.2/read/analyze`
- Method: POST
- Headers: Content-Type and API key authentication
- Body: Raw image buffer

**Request Details:**
```javascript
const response = await fetch(AZURE_VISION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': config.azureApiKey,
  },
  body: imageBuffer,
});
```

**Error Handling:**
- Validates HTTP response status
- Extracts operation location from headers
- Throws descriptive errors for API failures

#### `async getCaptchaAnalysisResult(operationLocation)`

Retrieves OCR analysis results from Azure Computer Vision.

**Parameters:**
- `operationLocation` (string): Azure operation URL

**Returns:** `Promise<Object>` - OCR analysis results

**Polling Strategy:**
- Waits for analysis completion (2 second delay)
- Retrieves results via GET request
- Returns parsed JSON response

**Example Response Structure:**
```javascript
{
  status: "succeeded",
  analyzeResult: {
    readResults: [{
      lines: [{
        text: "ABC123",
        boundingBox: [x1, y1, x2, y2, ...]
      }]
    }]
  }
}
```

### Text Processing

#### `extractTextFromResult(result)`

Extracts text content from Azure Computer Vision results.

**Parameters:**
- `result` (Object): Azure OCR analysis results

**Returns:** `string` - Extracted text content

**Processing Logic:**
- Validates result structure
- Extracts text from all detected lines
- Concatenates multiple lines with spaces
- Handles missing or invalid results

**Example:**
```javascript
// Input: Azure OCR result object
// Output: "ABC123" (concatenated text from all lines)
```

#### `processCaptchaText(text)`

Processes and validates extracted CAPTCHA text.

**Parameters:**
- `text` (string): Raw extracted text

**Returns:** `string` - Processed CAPTCHA text or 'error'

**Processing Steps:**
1. Trims whitespace
2. Validates text is not empty
3. Applies CAPTCHA-specific validation
4. Returns cleaned text or 'error'

#### `isValidCaptcha(text)`

Validates if extracted text represents a valid CAPTCHA.

**Parameters:**
- `text` (string): Text to validate

**Returns:** `boolean` - Validation result

**Validation Rules:**
- Must be non-empty after trimming
- Must contain alphanumeric characters
- Must meet minimum length requirements

## Constants

### API Configuration

```javascript
const AZURE_VISION_URL = `${config.azureEndpoint}vision/v3.2/read/analyze`;
const CAPTCHA_ANALYSIS_DELAY = 2000; // 2 seconds
```

### Image Processing

```javascript
const CAPTCHA_DIMENSIONS = { width: 200, height: 100 };
```

### Temporary Files

```javascript
const TEMP_FILES = ['captcha_original.png', 'captcha_resized.png'];
```

## Configuration Dependencies

The module requires the following configuration values:

```javascript
{
  azureEndpoint: string,    // Azure Computer Vision endpoint URL
  azureApiKey: string       // Azure Computer Vision API key
}
```

**Example Configuration:**
```javascript
{
  azureEndpoint: 'https://your-region.cognitiveservices.azure.com/',
  azureApiKey: 'your-32-character-api-key'
}
```

## Usage Patterns

### Basic CAPTCHA Solving

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

async function solveCaptchaBasic(page) {
  try {
    // Get CAPTCHA image
    const captchaImg = await page.$('img[src*="captcha"]');
    const imageBuffer = await captchaImg.screenshot();
    
    // Solve CAPTCHA
    const result = await solveCaptcha(imageBuffer);
    
    if (result !== 'error') {
      await page.type('#captcha-field', result);
      return true;
    }
    
    return false;
  } finally {
    await cleanupTempFiles();
  }
}
```

### CAPTCHA with Retry Logic

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

async function solveCaptchaWithRetry(page, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`CAPTCHA attempt ${attempt}/${maxAttempts}`);
      
      // Get fresh CAPTCHA image
      const captchaImg = await page.$('img[alt="驗證碼"]');
      const imageBuffer = await captchaImg.screenshot();
      
      // Solve CAPTCHA
      const result = await solveCaptcha(imageBuffer);
      
      if (result !== 'error') {
        await page.type('#captcha-input', result);
        console.log(`CAPTCHA solved on attempt ${attempt}: ${result}`);
        return result;
      }
      
      // Refresh CAPTCHA for next attempt
      if (attempt < maxAttempts) {
        await page.click('#refresh-captcha');
        await page.waitForTimeout(1000);
      }
      
    } catch (error) {
      console.error(`CAPTCHA attempt ${attempt} failed:`, error);
    } finally {
      await cleanupTempFiles();
    }
  }
  
  throw new Error(`Failed to solve CAPTCHA after ${maxAttempts} attempts`);
}
```

### Integration with Login Flow

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

async function loginWithCaptcha(page, username, password) {
  try {
    // Fill username and password
    await page.type('#username', username);
    await page.type('#password', password);
    
    // Solve CAPTCHA
    const captchaElement = await page.$('#captcha-image');
    const imageBuffer = await captchaElement.screenshot();
    const captchaText = await solveCaptcha(imageBuffer);
    
    if (captchaText === 'error') {
      throw new Error('CAPTCHA solving failed');
    }
    
    // Input CAPTCHA and submit
    await page.type('#captcha', captchaText);
    await page.click('#login-button');
    
    // Wait for login result
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    return true;
  } finally {
    await cleanupTempFiles();
  }
}
```

### Batch CAPTCHA Processing

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

async function processCaptchaBatch(imageBuffers) {
  const results = [];
  
  try {
    for (const [index, buffer] of imageBuffers.entries()) {
      console.log(`Processing CAPTCHA ${index + 1}/${imageBuffers.length}`);
      
      const result = await solveCaptcha(buffer);
      results.push({
        index,
        success: result !== 'error',
        text: result
      });
      
      // Small delay between requests to avoid rate limiting
      if (index < imageBuffers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } finally {
    await cleanupTempFiles();
  }
  
  return results;
}
```

## Error Handling

### Common Error Scenarios

1. **Invalid Azure Credentials**
```javascript
// Error: 401 Unauthorized
// Solution: Check azureApiKey and azureEndpoint configuration
```

2. **Network Connectivity Issues**
```javascript
// Error: Network request failed
// Solution: Check internet connection and Azure service status
```

3. **Invalid Image Format**
```javascript
// Error: Image processing failed
// Solution: Ensure image buffer is valid PNG/JPEG
```

4. **OCR Analysis Timeout**
```javascript
// Error: Analysis operation timed out
// Solution: Increase CAPTCHA_ANALYSIS_DELAY or implement polling
```

### Robust Error Handling Pattern

```javascript
import { solveCaptcha, cleanupTempFiles } from './captchaSolver.js';

async function robustCaptchaSolving(page) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      // Get CAPTCHA image with validation
      const captchaElement = await page.$('img[src*="captcha"]');
      if (!captchaElement) {
        throw new Error('CAPTCHA element not found');
      }
      
      const imageBuffer = await captchaElement.screenshot();
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid CAPTCHA image buffer');
      }
      
      // Solve CAPTCHA
      const result = await solveCaptcha(imageBuffer);
      
      if (result !== 'error') {
        console.log(`CAPTCHA solved successfully: ${result}`);
        return result;
      }
      
      console.log(`CAPTCHA attempt ${attempts} failed, retrying...`);
      
      // Refresh CAPTCHA
      await page.click('#refresh-captcha');
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.error(`CAPTCHA solving error (attempt ${attempts}):`, error);
      
      if (attempts === maxAttempts) {
        throw new Error(`CAPTCHA solving failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await page.waitForTimeout(3000);
    } finally {
      await cleanupTempFiles();
    }
  }
}
```

## Performance Considerations

### Image Optimization

```javascript
// Optimal image size for Azure OCR
const CAPTCHA_DIMENSIONS = { width: 200, height: 100 };

// Use appropriate image format
const optimizedBuffer = await sharp(originalBuffer)
  .resize(CAPTCHA_DIMENSIONS)
  .png({ quality: 90 })
  .toBuffer();
```

### API Rate Limiting

```javascript
// Implement delays between API calls
const CAPTCHA_ANALYSIS_DELAY = 2000;

// Add jitter to avoid thundering herd
const delay = CAPTCHA_ANALYSIS_DELAY + Math.random() * 1000;
await new Promise(resolve => setTimeout(resolve, delay));
```

### Memory Management

```javascript
// Clean up temporary files promptly
try {
  const result = await solveCaptcha(imageBuffer);
  return result;
} finally {
  await cleanupTempFiles(); // Always clean up
}
```

## Security Considerations

### API Key Protection

```javascript
// Never log API keys
console.log('Azure endpoint:', config.azureEndpoint);
// console.log('API key:', config.azureApiKey); // DON'T DO THIS

// Use environment variables
const apiKey = process.env.AZURE_API_KEY;
if (!apiKey) {
  throw new Error('Azure API key not configured');
}
```

### Temporary File Security

```javascript
// Temporary files contain sensitive CAPTCHA images
// Clean them up promptly
await cleanupTempFiles();

// Use secure temporary directory if needed
const tempDir = path.join(os.tmpdir(), 'captcha-secure');
```

### Network Security

```javascript
// Always use HTTPS endpoints
const endpoint = config.azureEndpoint;
if (!endpoint.startsWith('https://')) {
  throw new Error('Azure endpoint must use HTTPS');
}
```

## Troubleshooting

### Debug Mode

```javascript
// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Original image saved:', 'captcha_original.png');
  console.log('Resized image saved:', 'captcha_resized.png');
  console.log('OCR result:', result);
}
```

### Testing CAPTCHA Recognition

```javascript
import fs from 'fs';
import { solveCaptcha } from './captchaSolver.js';

// Test with saved CAPTCHA image
const testBuffer = fs.readFileSync('test-captcha.png');
const result = await solveCaptcha(testBuffer);
console.log('Test result:', result);
```

## Dependencies

- **node-fetch**: HTTP requests to Azure API
- **sharp**: Image processing and resizing
- **fs/promises**: File system operations
- **path**: File path utilities
- **url**: URL utilities
- **./configLoader.js**: Configuration management
- **./utils.js**: `wait` utility function

## Azure Computer Vision Setup

### Required Azure Resources

1. **Computer Vision Resource**
   - Create in Azure Portal
   - Note the endpoint URL
   - Copy API key

2. **Configuration**
```javascript
{
  azureEndpoint: 'https://your-region.cognitiveservices.azure.com/',
  azureApiKey: 'your-32-character-subscription-key'
}
```

3. **Pricing Considerations**
   - Free tier: 5,000 transactions per month
   - Standard tier: Pay per transaction
   - Monitor usage to avoid unexpected charges

### API Limitations

- **Rate Limits**: 20 calls per minute (free tier)
- **File Size**: Maximum 50MB per image
- **Supported Formats**: JPEG, PNG, BMP, PDF, TIFF
- **Text Languages**: Supports multiple languages including English, Chinese