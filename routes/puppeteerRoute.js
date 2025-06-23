const express = require('express');
const generateScreenshot = require('../utils/generateScreenshot');
const router = express.Router();

router.get('/generate-design-preview', async (req, res) => {
  const pageUrl = 'http://localhost:3000/product-detail.html'; // or your Render URL
  const outputPath = './uploads/design-preview.png';

  try {
    await generateScreenshot(pageUrl, outputPath);
    res.sendFile(outputPath, { root: '.' }); // Return image
  } catch (err) {
    console.error("❌ Puppeteer error:", err);
    res.status(500).send('Failed to generate preview.');
  }
});

module.exports = router;
