import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import defaultConfig from './config.example.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadLocalConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const module = await import(configPath);
      console.log('成功加載本地配置');
      return module.default;
    } else {
      console.warn('未找到本地配置檔案 config.js，將使用默認值');
    }
  } catch (error) {
    console.error('加載本地配置時發生錯誤:', error.message);
  }
  return {};
}

async function loadConfig() {
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const configPath = path.resolve(__dirname, './config.js');

  console.log('運行環境:', isGitHubActions ? 'GitHub Actions' : '本地環境');

  const localConfig = isGitHubActions ? {} : await loadLocalConfig(configPath);

  const envConfig = {
    azureEndpoint: process.env.AZURE_ENDPOINT,
    azureApiKey: process.env.AZURE_API_KEY,
    loginUrl: process.env.LOGIN_URL,
    username: process.env.FPG_USERNAME,
    password: process.env.FPG_PASSWORD,
  };

  const filteredEnvConfig = Object.fromEntries(
    Object.entries(envConfig).filter(([_, v]) => v != null)
  );

  const finalConfig = {
    ...defaultConfig,
    ...localConfig,
    ...filteredEnvConfig,
  };

  console.log('配置加載完成');

  return finalConfig;
}

export default await loadConfig();
