// routes/products.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await req.app.locals.db.collection('products').find().toArray();
    res.json(products);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET one product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await req.app.locals.db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// CREATE product
router.post('/', async (req, res) => {
  try {
    const result = await req.app.locals.db.collection('products').insertOne({
      ...req.body,
      createdAt: new Date()
    });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
});

// UPDATE product
router.put('/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(`PUT /products/:id error:`, err);
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});


// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
