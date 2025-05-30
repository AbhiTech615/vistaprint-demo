const bcrypt = require('bcrypt');

const password = 'password123'; // change this to the password you want to hash

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
