import fetch from 'node-fetch';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AZURE_VISION_URL = `${config.azureEndpoint}vision/v3.2/read/analyze`;
const CAPTCHA_ANALYSIS_DELAY = 2000;
const CAPTCHA_DIMENSIONS = { width: 200, height: 100 };
const TEMP_FILES = ['captcha_original.png', 'captcha_resized.png'];

async function solveCaptcha(imageBuffer) {
  try {
    await logOriginalImageMetadata(imageBuffer);
    const resizedImage = await resizeImage(imageBuffer);
    const operationLocation = await initiateCaptchaAnalysis(resizedImage);
    await wait(CAPTCHA_ANALYSIS_DELAY);
    const result = await getCaptchaAnalysisResult(operationLocation);
    const extractedText = extractTextFromResult(result);
    return processCaptchaText(extractedText);
  } catch (error) {
    console.error(`解析驗證碼時發生錯誤: ${error.message}`);
    return 'error';
  }
}

async function logOriginalImageMetadata(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  await fs.writeFile(path.join(__dirname, 'captcha_original.png'), imageBuffer);
}

async function resizeImage(imageBuffer) {
  const resizedImageBuffer = await sharp(imageBuffer)
    .resize({
      ...CAPTCHA_DIMENSIONS,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();
  await fs.writeFile(
    path.join(__dirname, 'captcha_resized.png'),
    resizedImageBuffer
  );
  return resizedImageBuffer;
}

async function initiateCaptchaAnalysis(imageBuffer) {
  const response = await fetch(AZURE_VISION_URL, {
    method: 'POST',
    body: imageBuffer,
    headers: {
      'Ocp-Apim-Subscription-Key': config.azureApiKey,
      'Content-Type': 'application/octet-stream',
    },
  });

  if (response.status !== 202) {
    throw new Error(`未預期的響應狀態: ${response.status}`);
  }

  const operationLocation = response.headers.get('operation-location');
  if (!operationLocation) {
    throw new Error('未收到 operation-location 標頭');
  }

  return operationLocation;
}

async function getCaptchaAnalysisResult(operationLocation) {
  const response = await fetch(operationLocation, {
    headers: { 'Ocp-Apim-Subscription-Key': config.azureApiKey },
  });
  return response.json();
}

function extractTextFromResult(result) {
  if (!result || result.status !== 'succeeded') {
    throw new Error(
      `分析失敗或未完成。狀態: ${result ? result.status : '未知'}`
    );
  }

  const lines = result.analyzeResult?.readResults?.[0]?.lines;
  if (!lines || lines.length === 0) {
    throw new Error('分析結果中未找到文字行');
  }

  return lines.map((line) => line.text).join(' ');
}

function processCaptchaText(text) {
  const cleanedText = text.replace(/\D/g, '');
  return isValidCaptcha(cleanedText) ? cleanedText : 'error';
}

function isValidCaptcha(text) {
  return /^\d{4}$/.test(text);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupTempFiles() {
  for (const file of TEMP_FILES) {
    const filePath = path.join(__dirname, file);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting ${file}:`, error);
      }
    }
  }
}

export { solveCaptcha, cleanupTempFiles };
