const puppeteer = require('puppeteer');

async function generateScreenshot(url, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle0' }); // Wait until all assets load
  await page.screenshot({ path: outputPath, fullPage: true });

  await browser.close();
  console.log("✅ Screenshot saved to:", outputPath);
}

module.exports = generateScreenshot;
