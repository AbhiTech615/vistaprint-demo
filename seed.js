// seed.js
const { connectToDatabase } = require('./mongo');

async function seed() {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');

  // Insert a test user document
  const result = await usersCollection.insertOne({
    name: 'Test User',
    email: 'test@example.com',
    joined: new Date(),
  });

  console.log('Inserted document ID:', result.insertedId);
  process.exit(0);
}

seed().catch(err => {
  console.error('🔴 Seed error:', err);
  process.exit(1);
});
