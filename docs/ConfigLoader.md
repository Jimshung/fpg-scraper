# ConfigLoader Module Documentation

## Overview

The `configLoader.js` module provides a flexible configuration management system that supports multiple configuration sources with a clear priority hierarchy. It handles loading from local files, environment variables, and default values while ensuring secure credential management.

## Exports

```javascript
export default await loadConfig();
```

The module exports a default configuration object that is immediately loaded and ready for use across the application.

## Public Interface

### Default Export: `config`

The module exports a fully loaded configuration object with all settings resolved from multiple sources.

**Usage:**
```javascript
import config from './configLoader.js';

console.log('Azure Endpoint:', config.azureEndpoint);
console.log('Login URL:', config.loginUrl);
console.log('Headless Mode:', config.headless);
```

## Configuration Sources (Priority Order)

The configuration system loads settings from multiple sources in order of priority:

1. **Environment Variables** (Highest Priority)
2. **Local config.js file**
3. **Default values from config.example.js** (Lowest Priority)

### 1. Environment Variables

Environment variables take the highest priority and override all other settings.

**Supported Environment Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `AZURE_ENDPOINT` | string | Azure Computer Vision endpoint URL |
| `AZURE_API_KEY` | string | Azure Computer Vision API key |
| `LOGIN_URL` | string | Target login page URL |
| `FPG_USERNAME` | string | Login username |
| `FPG_PASSWORD` | string | Login password |
| `HEADLESS` | boolean | Browser headless mode (`'true'` or `'false'`) |

**Example:**
```bash
export AZURE_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
export AZURE_API_KEY="your-azure-api-key"
export LOGIN_URL="https://your-site.com/login"
export FPG_USERNAME="your-username"
export FPG_PASSWORD="your-password"
export HEADLESS="true"
```

### 2. Local Configuration File

A local `config.js` file can be created to provide configuration values.

**File Location:** `./config.js` (same directory as configLoader.js)

**Example config.js:**
```javascript
export default {
  azureEndpoint: 'https://eastus.api.cognitive.microsoft.com/',
  azureApiKey: 'your-azure-api-key-here',
  loginUrl: 'https://your-target-site.com/login',
  username: 'your-username',
  password: 'your-password',
  headless: false
};
```

### 3. Default Configuration

Default values are provided by `config.example.js` as a fallback.

**Example config.example.js:**
```javascript
export default {
  azureEndpoint: process.env.AZURE_ENDPOINT || 'YOUR_AZURE_ENDPOINT',
  azureApiKey: process.env.AZURE_API_KEY || 'YOUR_AZURE_API_KEY',
  loginUrl: process.env.LOGIN_URL || 'YOUR_LOGIN_URL',
  username: process.env.FPG_USERNAME || 'YOUR_USERNAME',
  password: process.env.FPG_PASSWORD || 'YOUR_PASSWORD',
};
```

## Internal Functions

### `async loadLocalConfig(configPath)`

Loads configuration from a local JavaScript file.

**Parameters:**
- `configPath` (string): Path to the local configuration file

**Returns:** `Promise<Object>` - Configuration object or empty object if loading fails

**Behavior:**
- Checks if config file exists
- Dynamically imports the configuration module
- Returns empty object on any error (file not found, syntax errors, etc.)
- Logs success/failure status

**Example:**
```javascript
const localConfig = await loadLocalConfig('./config.js');
// Returns: { azureEndpoint: '...', username: '...', ... } or {}
```

### `async loadConfig()`

Main configuration loading function that orchestrates the entire configuration process.

**Returns:** `Promise<Object>` - Complete configuration object

**Workflow:**
1. Loads local configuration file
2. Extracts environment variables
3. Filters out null/undefined environment values
4. Merges configurations in priority order
5. Returns final configuration object

**Configuration Merging:**
```javascript
const finalConfig = {
  ...defaultConfig,      // Lowest priority
  ...localConfig,        // Medium priority
  ...filteredEnvConfig,  // Highest priority
};
```

## Configuration Schema

### Complete Configuration Object

```javascript
{
  azureEndpoint: string,     // Azure Computer Vision endpoint
  azureApiKey: string,       // Azure Computer Vision API key
  loginUrl: string,          // Target login page URL
  username: string,          // Login username
  password: string,          // Login password
  headless: boolean          // Browser headless mode
}
```

### Configuration Validation

The module performs basic validation:

- **Environment Variable Filtering**: Only includes non-null, non-undefined values
- **Type Coercion**: Converts string 'true'/'false' to boolean for headless mode
- **Command Line Arguments**: Checks for `--headless` flag in process.argv

**Headless Mode Resolution:**
```javascript
headless: process.env.HEADLESS === 'true' || process.argv.includes('--headless')
```

## Usage Patterns

### Basic Configuration Access

```javascript
import config from './configLoader.js';

// Access configuration values
const endpoint = config.azureEndpoint;
const apiKey = config.azureApiKey;
const isHeadless = config.headless;

console.log('Configuration loaded successfully');
console.log('Headless mode:', isHeadless);
```

### Conditional Configuration

```javascript
import config from './configLoader.js';

// Check if required configuration is available
if (!config.azureApiKey || config.azureApiKey === 'YOUR_AZURE_API_KEY') {
  throw new Error('Azure API key not configured');
}

if (!config.loginUrl || config.loginUrl === 'YOUR_LOGIN_URL') {
  throw new Error('Login URL not configured');
}

console.log('Configuration validation passed');
```

### Environment-Specific Configuration

```javascript
import config from './configLoader.js';

// Development vs Production settings
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

if (isDevelopment) {
  console.log('Development mode - using local config');
  console.log('Login URL:', config.loginUrl);
} else if (isProduction) {
  console.log('Production mode - using environment variables');
  // Don't log sensitive values in production
}
```

### Configuration Debugging

```javascript
import config from './configLoader.js';

// Safe logging (excludes sensitive values)
const safeConfig = {
  azureEndpoint: config.azureEndpoint,
  loginUrl: config.loginUrl,
  username: config.username ? '[CONFIGURED]' : '[NOT SET]',
  password: config.password ? '[CONFIGURED]' : '[NOT SET]',
  azureApiKey: config.azureApiKey ? '[CONFIGURED]' : '[NOT SET]',
  headless: config.headless
};

console.log('Configuration status:', safeConfig);
```

## Security Best Practices

### Credential Protection

```javascript
// ❌ DON'T: Log sensitive configuration
console.log('Config:', config);

// ✅ DO: Log only non-sensitive values
console.log('Azure Endpoint:', config.azureEndpoint);
console.log('Headless Mode:', config.headless);
console.log('Credentials configured:', !!config.username && !!config.password);
```

### Environment Variable Validation

```javascript
import config from './configLoader.js';

// Validate required credentials are present
const requiredFields = ['azureEndpoint', 'azureApiKey', 'loginUrl', 'username', 'password'];

for (const field of requiredFields) {
  if (!config[field] || config[field].startsWith('YOUR_')) {
    throw new Error(`Configuration field '${field}' is not properly configured`);
  }
}
```

### Configuration File Security

```javascript
// .gitignore should include:
// config.js
// .env
// *.key
// secrets/

// config.js should never be committed to version control
// Use config.example.js as a template instead
```

## Error Handling

### Configuration Loading Errors

The module handles various error scenarios gracefully:

1. **Missing config.js file**: Uses empty object, continues with other sources
2. **Syntax errors in config.js**: Logs error, uses empty object
3. **Import failures**: Catches and logs errors, continues execution
4. **Invalid environment variables**: Filters out invalid values

**Error Logging Examples:**
```javascript
// Missing file
console.warn('未找到本地配置檔案 config.js，將使用默認值');

// Loading error
console.error('加載本地配置時發生錯誤:', error.message);

// Success
console.log('成功加載本地配置');
console.log('配置加載完成');
```

### Validation Pattern

```javascript
import config from './configLoader.js';

function validateConfiguration(config) {
  const errors = [];
  
  if (!config.azureEndpoint) {
    errors.push('Azure endpoint is required');
  }
  
  if (!config.azureApiKey) {
    errors.push('Azure API key is required');
  }
  
  if (!config.loginUrl) {
    errors.push('Login URL is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
  
  return true;
}

// Validate before using
validateConfiguration(config);
```

## Setup Instructions

### 1. Create Local Configuration

```bash
# Copy example configuration
cp config.example.js config.js

# Edit with your values
nano config.js
```

### 2. Environment Variable Setup

**Linux/macOS:**
```bash
export AZURE_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
export AZURE_API_KEY="your-azure-api-key"
export LOGIN_URL="https://your-site.com/login"
export FPG_USERNAME="your-username"
export FPG_PASSWORD="your-password"
export HEADLESS="true"
```

**Windows:**
```cmd
set AZURE_ENDPOINT=https://your-region.cognitiveservices.azure.com/
set AZURE_API_KEY=your-azure-api-key
set LOGIN_URL=https://your-site.com/login
set FPG_USERNAME=your-username
set FPG_PASSWORD=your-password
set HEADLESS=true
```

**Docker:**
```dockerfile
ENV AZURE_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
ENV AZURE_API_KEY="your-azure-api-key"
ENV LOGIN_URL="https://your-site.com/login"
ENV FPG_USERNAME="your-username"
ENV FPG_PASSWORD="your-password"
ENV HEADLESS="true"
```

### 3. GitHub Actions

```yaml
env:
  AZURE_ENDPOINT: ${{ secrets.AZURE_ENDPOINT }}
  AZURE_API_KEY: ${{ secrets.AZURE_API_KEY }}
  LOGIN_URL: ${{ secrets.LOGIN_URL }}
  FPG_USERNAME: ${{ secrets.FPG_USERNAME }}
  FPG_PASSWORD: ${{ secrets.FPG_PASSWORD }}
  HEADLESS: 'true'
```

## Configuration Examples

### Development Configuration

```javascript
// config.js (for development)
export default {
  azureEndpoint: 'https://eastus.api.cognitive.microsoft.com/',
  azureApiKey: 'dev-api-key-here',
  loginUrl: 'https://staging.example.com/login',
  username: 'dev-user',
  password: 'dev-password',
  headless: false  // Visual debugging
};
```

### Production Configuration

```bash
# Production environment variables
export AZURE_ENDPOINT="https://prod-region.api.cognitive.microsoft.com/"
export AZURE_API_KEY="prod-api-key"
export LOGIN_URL="https://production.example.com/login"
export FPG_USERNAME="prod-user"
export FPG_PASSWORD="secure-prod-password"
export HEADLESS="true"
```

### CI/CD Configuration

```yaml
# GitHub Actions
- name: Run automation
  env:
    AZURE_ENDPOINT: ${{ secrets.AZURE_ENDPOINT }}
    AZURE_API_KEY: ${{ secrets.AZURE_API_KEY }}
    LOGIN_URL: ${{ secrets.LOGIN_URL }}
    FPG_USERNAME: ${{ secrets.FPG_USERNAME }}
    FPG_PASSWORD: ${{ secrets.FPG_PASSWORD }}
    HEADLESS: 'true'
    GITHUB_ACTIONS: 'true'
  run: npm start
```

## Troubleshooting

### Common Issues

1. **Configuration not loading**
   - Check file paths and permissions
   - Verify config.js syntax
   - Check console logs for error messages

2. **Environment variables not working**
   - Verify variable names match exactly
   - Check if variables are exported
   - Restart terminal/process after setting variables

3. **Headless mode not working**
   - Check boolean conversion: `'true'` string becomes `true` boolean
   - Verify command line arguments: `--headless` flag
   - Check environment variable: `HEADLESS='true'`

### Debug Configuration Loading

```javascript
// Add debug logging to see configuration sources
import config from './configLoader.js';

console.log('Environment variables:');
console.log('- AZURE_ENDPOINT:', process.env.AZURE_ENDPOINT ? '[SET]' : '[NOT SET]');
console.log('- AZURE_API_KEY:', process.env.AZURE_API_KEY ? '[SET]' : '[NOT SET]');
console.log('- LOGIN_URL:', process.env.LOGIN_URL ? '[SET]' : '[NOT SET]');
console.log('- HEADLESS:', process.env.HEADLESS);

console.log('\nFinal configuration:');
console.log('- azureEndpoint:', config.azureEndpoint ? '[CONFIGURED]' : '[NOT SET]');
console.log('- azureApiKey:', config.azureApiKey ? '[CONFIGURED]' : '[NOT SET]');
console.log('- loginUrl:', config.loginUrl ? '[CONFIGURED]' : '[NOT SET]');
console.log('- headless:', config.headless);
```

## Dependencies

- **fs**: File system operations (checking file existence)
- **path**: Path resolution utilities
- **url**: URL utilities for ES modules
- **./config.example.js**: Default configuration values

## Migration Guide

### From Hardcoded Values

```javascript
// ❌ Old approach
const azureEndpoint = 'https://eastus.api.cognitive.microsoft.com/';
const apiKey = 'hardcoded-key';

// ✅ New approach
import config from './configLoader.js';
const azureEndpoint = config.azureEndpoint;
const apiKey = config.azureApiKey;
```

### From Simple Environment Variables

```javascript
// ❌ Old approach
const headless = process.env.HEADLESS === 'true';

// ✅ New approach
import config from './configLoader.js';
const headless = config.headless;
```

This configuration system provides a robust, flexible, and secure way to manage application settings across different environments and deployment scenarios.