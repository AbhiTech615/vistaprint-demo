// routes/users.js
const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await req.app.locals.db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST a new user
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    const result = await req.app.locals.db.collection('users').insertOne({
      name,
      email,
      joined: new Date()
    });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('POST /users error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT (Update) user
router.put('/:id', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    const result = await req.app.locals.db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, email } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('PUT /users/:id error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
