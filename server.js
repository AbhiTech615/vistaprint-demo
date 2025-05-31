// server.js
// ───────────────────────────────────────────────────────────────────────────────
//
// Production-ready Express + MySQL session store setup.
//
// 1. Uses express-mysql-session to avoid the "MemoryStore" warning.
// 2. Loads all DB credentials and secrets from environment variables.
// 3. Exposes /admin/login and /admin/dashboard as before.
//
// Make sure your .env file (or Render environment vars) contains:
//   DB_HOST=…
//   DB_PORT=…        ← e.g. 3306 (omit if default)
//   DB_USER=…
//   DB_PASSWORD=…
//   DB_NAME=…
//   SESSION_SECRET=…
//

require('dotenv').config(); // Load .env variables first

const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const session  = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql    = require('mysql2');
const fs       = require('fs');

const app = express();

// ─── Log Environment Variables (for debugging) ────────────────────────────────
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : undefined);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT || 3306);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '*****' : undefined);
// ────────────────────────────────────────────────────────────────────────────────

// Enable CORS (adjust origins if needed in production)
app.use(cors());

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ─── MySQL Connection Options ─────────────────────────────────────────────────
const dbOptions = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,

  // If your remote MySQL requires SSL (e.g. PlanetScale), uncomment below:
  // ssl: {
  //   rejectUnauthorized: true,
  //   ca: fs.readFileSync(path.join(__dirname, 'pscale-ca.pem'))
  // }
};

// Create a single connection instance for queries
const db = mysql.createConnection(dbOptions);
db.connect(err => {
  if (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1); // Crash if DB connection fails
  }
  console.log('✅ Connected to MySQL Database');
});

// ─── Configure express-session to use MySQLStore ───────────────────────────────
const sessionStore = new MySQLStore(dbOptions);

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'change_this_to_a_long_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,             // Set to true once you serve over HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// ─── Routes ─────────────────────────────────────────────────────────────────────

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin Login Page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});

// Test Route (sanity check)
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Admin Login Submission
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

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
