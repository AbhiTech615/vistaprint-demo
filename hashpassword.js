const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';  // your admin password
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Hashed password:', hash);
  } catch (err) {
    console.error(err);
  }
}

generateHash();
