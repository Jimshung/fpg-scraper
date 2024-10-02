import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function clearScreenshotsFolder() {
  try {
    const exists = await fs
      .access(SCREENSHOTS_DIR)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      console.log('Clearing screenshots folder...');
      await fs.rm(SCREENSHOTS_DIR, { recursive: true, force: true });
      console.log('Screenshots folder cleared.');
    } else {
      console.log('Screenshots folder does not exist. No need to clear.');
    }
  } catch (error) {
    console.error('Error while clearing screenshots folder:', error);
  }
}

async function ensureScreenshotsDirExists() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log('Screenshots directory ensured.');
  } catch (error) {
    console.error('Error while creating screenshots directory:', error);
  }
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(
    SCREENSHOTS_DIR,
    `${name}_${Date.now()}.png`
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  clearScreenshotsFolder,
  ensureScreenshotsDirExists,
  takeScreenshot,
  wait,
};
