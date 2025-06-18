
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await req.app.locals.db
      .collection('orders')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await req.app.locals.db
      .collection('orders')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Not found' });
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// UPDATE order status
router.put('/:id', async (req, res) => {
  const { status, customer } = req.body;

  try {
    const result = await req.app.locals.db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status,
          ...(customer && { 'customer.address': customer.address })
        }
      }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});


// DELETE order by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await req.app.locals.db
      .collection('orders')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
