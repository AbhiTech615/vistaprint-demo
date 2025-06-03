// adminSeed.js
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./mongo');

async function seedAdmin() {
  const db = await connectToDatabase();
  const adminUsers = db.collection('admin_users');

  // Change these credentials as you like:
  const username = 'admin';
  const plainTextPassword = 'secureAdmin123';

  // Hash the password
  const hashed = await bcrypt.hash(plainTextPassword, 10);

  // Insert or upsert (avoid duplicates)
  const result = await adminUsers.updateOne(
    { username },
    { $set: { password: hashed } },
    { upsert: true }
  );

  console.log(`✅ Admin user "${username}" created/updated (ID: ${result.upsertedId || result.matchedCount ? 'existing' : result.upsertedId})`);
  console.log(`   → Username: ${username}`);
  console.log(`   → Password: ${plainTextPassword}`);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('🔴 adminSeed error:', err);
  process.exit(1);
});
