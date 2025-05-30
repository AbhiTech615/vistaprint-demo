const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Test1234';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password:', hash);
}

generateHash();


const session = require('express-session');
require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : undefined);
console.log('DB_NAME:', process.env.DB_NAME);

const mysql = require('mysql2');

const app = express();

// Enable CORS
app.use(cors());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a strong secret
  resave: false,
  saveUninitialized: true
}));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL Database');
});


// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Admin Login Page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});


app.get('/test', (req, res) => {
  res.send('Server is working!');
});


// Admin Login Submission with bcrypt and session
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM admin_users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) return res.status(500).send('Server error');

    if (results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.admin = user.username;
        return res.redirect('/admin/dashboard');
      } else {
        return res.send('Invalid password');
      }
    } else {
      return res.send('User not found');
    }
  });
});



// Admin Dashboard (Protected)
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
