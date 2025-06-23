const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const router = express.Router();

router.post('/generate-preview', async (req, res) => {
  try {
    const { base64Image } = req.body; // Expecting base64 string from canvas

    const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
    const inputPath = './uploads/input.png';
    const outputPath = './uploads/output-preview.png';

    fs.writeFileSync(inputPath, base64Data, 'base64');

    await sharp(inputPath)
      .resize(500) // Resize if needed
      .toFile(outputPath);

    res.json({ success: true, message: "Preview generated!", file: outputPath });
  } catch (err) {
    console.error("Sharp error:", err);
    res.status(500).json({ success: false, message: "Image processing failed." });
  }
});

module.exports = router;
