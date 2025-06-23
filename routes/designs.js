const express = require('express');
const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const { productId, productName, quantity, designJson } = req.body;
    const db = req.app.locals.db;

    const result = await db.collection('designs').insertOne({
      productId,
      productName,
      quantity,
      designJson,
      createdAt: new Date()
    });

    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('❌ Error saving design:', err);
    res.status(500).json({ error: 'DB insert failed', details: err.message });
  }
});

module.exports = router;

const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/upload/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// Route: POST /api/designs/upload
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, url: `/upload/${req.file.filename}` });
});

