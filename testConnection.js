// testConnection.js
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); // loads MONGODB_URI from .env

// Grab the URI from .env
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('🔴 MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Create a MongoClient with Stable API options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Ping the “admin” database to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. Successfully connected to MongoDB!");
  } finally {
    // Close the client when complete
    await client.close();
  }
}

run().catch(err => {
  console.error('🔴 Test connection failed:', err);
  process.exit(1);
});
