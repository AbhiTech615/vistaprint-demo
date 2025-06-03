// mongo.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Grab the URI from .env
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('🔴 MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Create a single MongoClient instance
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbInstance;

/**
 * Connects to MongoDB Atlas and returns a cached db instance.
 */
async function connectToDatabase() {
  if (dbInstance) {
    return dbInstance;
  }
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    dbInstance = client.db(); // Uses the database name from your MONGODB_URI (e.g. “vistaprintdb”)
    return dbInstance;
  } catch (err) {
    console.error('🔴 MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectToDatabase };
