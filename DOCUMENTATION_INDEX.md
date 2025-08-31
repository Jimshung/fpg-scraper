# FPG Automation - Complete Documentation Index

## 📖 Documentation Overview

This document provides a comprehensive index of all documentation for the FPG Automation project. The documentation is organized into multiple files covering different aspects of the system.

## 🚀 Quick Start

1. **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
2. **[Usage Guide](./USAGE_GUIDE.md)** - Practical usage examples and patterns
3. **[Module Documentation](#module-documentation)** - Detailed documentation for each module

## 📚 Documentation Structure

### Main Documentation Files

| Document | Description | Audience |
|----------|-------------|----------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference with all public functions, classes, and examples | Developers integrating the API |
| [USAGE_GUIDE.md](./USAGE_GUIDE.md) | Practical usage examples, common patterns, and best practices | Users implementing automation |
| [README.md](./README.md) | Project overview and basic setup instructions | New users and contributors |

### Module Documentation

| Module | Documentation | Description |
|--------|---------------|-------------|
| **FPGAutomation** | [docs/FPGAutomation.md](./docs/FPGAutomation.md) | Main automation orchestrator and workflow classes |
| **BrowserSetup** | [docs/BrowserSetup.md](./docs/BrowserSetup.md) | Browser management, login, and CAPTCHA handling |
| **Utils** | [docs/Utils.md](./docs/Utils.md) | Utility functions for DOM interaction and automation helpers |
| **CaptchaSolver** | [docs/CaptchaSolver.md](./docs/CaptchaSolver.md) | CAPTCHA recognition using Azure Computer Vision |
| **ConfigLoader** | [docs/ConfigLoader.md](./docs/ConfigLoader.md) | Configuration management and environment handling |

## 🔍 Documentation by Use Case

### Getting Started

1. **Project Setup**
   - [README.md](./README.md) - Basic project information
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#quick-start) - Installation and configuration
   - [docs/ConfigLoader.md](./docs/ConfigLoader.md#setup-instructions) - Configuration setup

2. **First Automation**
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#common-use-cases) - Basic usage patterns
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#usage-examples) - Code examples

### Development

1. **API Integration**
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
   - [docs/FPGAutomation.md](./docs/FPGAutomation.md) - Main automation classes

2. **Custom Automation**
   - [docs/Utils.md](./docs/Utils.md) - Utility functions for custom workflows
   - [docs/BrowserSetup.md](./docs/BrowserSetup.md) - Browser management

3. **CAPTCHA Handling**
   - [docs/CaptchaSolver.md](./docs/CaptchaSolver.md) - CAPTCHA recognition setup and usage

### Advanced Usage

1. **Production Deployment**
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#environment-variables) - Environment configuration
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#integration-examples) - CI/CD integration

2. **Error Handling & Debugging**
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#debugging-and-troubleshooting) - Troubleshooting guide
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#error-handling) - Error handling patterns

3. **Performance Optimization**
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md#performance-optimization) - Performance tips
   - [docs/BrowserSetup.md](./docs/BrowserSetup.md#environment-considerations) - Environment optimization

## 📋 API Reference Quick Links

### Core Classes

| Class | Documentation | Key Methods |
|-------|---------------|-------------|
| `FPGAutomation` | [docs/FPGAutomation.md](./docs/FPGAutomation.md#fpgautomation) | `run(options)` |
| `NavigationManager` | [docs/FPGAutomation.md](./docs/FPGAutomation.md#navigationmanager) | `navigateToSaleBulletin()`, `clickBackToMainButton()` |
| `SearchManager` | [docs/FPGAutomation.md](./docs/FPGAutomation.md#searchmanager) | `performSearch(options)` |
| `ResultProcessor` | [docs/FPGAutomation.md](./docs/FPGAutomation.md#resultprocessor) | `processResults(options)` |

### Essential Functions

| Function | Module | Documentation | Purpose |
|----------|--------|---------------|---------|
| `runAutomation()` | fpgAutomation | [docs/FPGAutomation.md](./docs/FPGAutomation.md#async-runautomationoptions) | High-level automation execution |
| `loginFPG()` | browserSetup | [docs/BrowserSetup.md](./docs/BrowserSetup.md#async-loginfpgisheadless--false) | Automated login with CAPTCHA |
| `solveCaptcha()` | captchaSolver | [docs/CaptchaSolver.md](./docs/CaptchaSolver.md#async-solvecaptchaimagebuffer) | CAPTCHA recognition |
| `takeScreenshot()` | utils | [docs/Utils.md](./docs/Utils.md#async-takescreenshotpage-name) | Screenshot capture |
| `retryOperation()` | utils | [docs/Utils.md](./docs/Utils.md#async-retryoperationoperation-maxretries--3) | Retry logic with backoff |

## 🛠 Configuration Reference

### Environment Variables

| Variable | Type | Required | Documentation |
|----------|------|----------|---------------|
| `AZURE_ENDPOINT` | string | Yes | [docs/ConfigLoader.md](./docs/ConfigLoader.md#environment-variables) |
| `AZURE_API_KEY` | string | Yes | [docs/CaptchaSolver.md](./docs/CaptchaSolver.md#azure-computer-vision-setup) |
| `LOGIN_URL` | string | Yes | [docs/ConfigLoader.md](./docs/ConfigLoader.md#environment-variables) |
| `FPG_USERNAME` | string | Yes | [docs/ConfigLoader.md](./docs/ConfigLoader.md#environment-variables) |
| `FPG_PASSWORD` | string | Yes | [docs/ConfigLoader.md](./docs/ConfigLoader.md#environment-variables) |
| `HEADLESS` | boolean | No | [docs/BrowserSetup.md](./docs/BrowserSetup.md#environment-considerations) |

### Configuration Files

| File | Purpose | Documentation |
|------|---------|---------------|
| `config.js` | Local configuration | [docs/ConfigLoader.md](./docs/ConfigLoader.md#local-configuration-file) |
| `config.example.js` | Configuration template | [docs/ConfigLoader.md](./docs/ConfigLoader.md#default-configuration) |

## 🔧 Development Resources

### Code Examples

| Example Type | Location | Description |
|--------------|----------|-------------|
| Basic Usage | [USAGE_GUIDE.md](./USAGE_GUIDE.md#common-use-cases) | Simple automation scenarios |
| Advanced Patterns | [USAGE_GUIDE.md](./USAGE_GUIDE.md#advanced-usage) | Complex automation workflows |
| Error Handling | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#error-handling) | Robust error handling patterns |
| Integration | [USAGE_GUIDE.md](./USAGE_GUIDE.md#integration-examples) | CI/CD and API integration |

### Best Practices

| Topic | Documentation | Key Points |
|-------|---------------|------------|
| Security | [docs/ConfigLoader.md](./docs/ConfigLoader.md#security-best-practices) | Credential management, secure configuration |
| Performance | [USAGE_GUIDE.md](./USAGE_GUIDE.md#performance-optimization) | Headless mode, batch processing |
| Error Handling | [docs/Utils.md](./docs/Utils.md#best-practices) | Retry logic, screenshot debugging |
| Testing | [docs/CaptchaSolver.md](./docs/CaptchaSolver.md#troubleshooting) | CAPTCHA testing, debug modes |

## 🐛 Troubleshooting Resources

### Common Issues

| Issue Category | Documentation | Solutions |
|----------------|---------------|-----------|
| Installation | [USAGE_GUIDE.md](./USAGE_GUIDE.md#debugging-and-troubleshooting) | Dependencies, Chrome setup |
| Configuration | [docs/ConfigLoader.md](./docs/ConfigLoader.md#troubleshooting) | Environment variables, file paths |
| CAPTCHA | [docs/CaptchaSolver.md](./docs/CaptchaSolver.md#troubleshooting) | Azure setup, API limits |
| Browser Issues | [docs/BrowserSetup.md](./docs/BrowserSetup.md#troubleshooting) | Headless mode, timeouts |
| Automation Failures | [docs/Utils.md](./docs/Utils.md#error-handling-and-retry-logic) | Element selection, timing issues |

### Debug Tools

| Tool | Documentation | Usage |
|------|---------------|-------|
| Screenshots | [docs/Utils.md](./docs/Utils.md#screenshot-management) | Visual debugging |
| Console Logs | [docs/BrowserSetup.md](./docs/BrowserSetup.md#debug-mode) | Detailed logging |
| Retry Logic | [docs/Utils.md](./docs/Utils.md#async-retryoperationoperation-maxretries--3) | Handling transient failures |
| Error Handlers | [docs/Utils.md](./docs/Utils.md#async-handleerrorpage-operation-error) | Standardized error handling |

## 📊 Project Structure

```
FPG-Automation/
├── 📄 Main Documentation
│   ├── API_DOCUMENTATION.md          # Complete API reference
│   ├── USAGE_GUIDE.md               # Usage examples and patterns
│   ├── DOCUMENTATION_INDEX.md       # This file
│   └── README.md                    # Project overview
│
├── 📁 docs/                         # Module-specific documentation
│   ├── FPGAutomation.md            # Main automation classes
│   ├── BrowserSetup.md             # Browser management
│   ├── Utils.md                    # Utility functions
│   ├── CaptchaSolver.md            # CAPTCHA recognition
│   └── ConfigLoader.md             # Configuration system
│
├── 🔧 Source Code
│   ├── fpgAutomation.js            # Main automation logic
│   ├── browserSetup.js             # Browser setup and login
│   ├── utils.js                    # Utility functions
│   ├── captchaSolver.js            # CAPTCHA solving
│   ├── configLoader.js             # Configuration loading
│   └── config.example.js           # Configuration template
│
└── 📦 Package Files
    ├── package.json                # Project configuration
    ├── package-lock.json           # Dependency lock file
    └── .gitignore                  # Git ignore rules
```

## 🎯 Documentation Maintenance

### Contributing to Documentation

1. **Adding New Features**
   - Update relevant module documentation
   - Add examples to API_DOCUMENTATION.md
   - Update usage patterns in USAGE_GUIDE.md

2. **Fixing Issues**
   - Update troubleshooting sections
   - Add common solutions to relevant docs
   - Update configuration examples if needed

3. **Documentation Standards**
   - Include code examples for all public APIs
   - Provide both basic and advanced usage patterns
   - Keep troubleshooting sections up-to-date
   - Use consistent formatting and structure

### Documentation Checklist

- [ ] All public functions documented with parameters and examples
- [ ] Configuration options explained with examples
- [ ] Common use cases covered in usage guide
- [ ] Error scenarios documented with solutions
- [ ] Integration examples provided
- [ ] Security considerations addressed
- [ ] Performance tips included

## 🔗 External Resources

### Dependencies Documentation

| Dependency | Version | Documentation | Usage in Project |
|------------|---------|---------------|------------------|
| Puppeteer | ^23.5.3 | [puppeteer.dev](https://puppeteer.dev) | Browser automation |
| Sharp | ^0.33.2 | [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com) | Image processing |
| Node-fetch | ^3.3.2 | [github.com/node-fetch/node-fetch](https://github.com/node-fetch/node-fetch) | HTTP requests |

### Azure Services

| Service | Documentation | Usage |
|---------|---------------|-------|
| Computer Vision | [docs.microsoft.com/azure/cognitive-services/computer-vision/](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/) | CAPTCHA OCR |

---

## 📞 Support

For questions or issues not covered in this documentation:

1. Check the [troubleshooting sections](#troubleshooting-resources) in relevant modules
2. Review [common issues](#common-issues) and solutions
3. Examine the [code examples](#code-examples) for similar use cases
4. Refer to the [API reference](#api-reference-quick-links) for detailed function documentation

---

*Last updated: 2024-01-15*
*Documentation version: 1.0.0*