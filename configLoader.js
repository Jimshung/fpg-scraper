import defaultConfig from './config.example.js';
import localConfig from './config.js';

function loadConfig() {
  // 首先嘗試從環境變量加載配置
  const envConfig = {
    azureEndpoint: process.env.AZURE_ENDPOINT,
    azureApiKey: process.env.AZURE_API_KEY,
    loginUrl: process.env.LOGIN_URL,
    username: process.env.FPG_USERNAME,
    password: process.env.FPG_PASSWORD,
  };

  // 合併配置，優先級：環境變量 > 本地配置 > 默認配置
  return {
    ...defaultConfig,
    ...localConfig,
    ...Object.fromEntries(
      Object.entries(envConfig).filter(([_, v]) => v != null)
    ),
  };
}

export default loadConfig();
