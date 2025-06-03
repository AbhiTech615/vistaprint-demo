// server.js
const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const { connectToDatabase } = require('./mongo');
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── 1) Connect to MongoDB before handling requests ────────────────────────────
app.use(async (req, res, next) => {
  if (!req.app.locals.db) {
    try {
      req.app.locals.db = await connectToDatabase();
      console.log('🗄️  MongoDB connection established');
    } catch (err) {
      console.error('🔴 Fatal: could not connect to MongoDB:', err);
      return res.status(500).send('Database connection error');
    }
  }
  next();
});

// ─── 2) Global Middleware ───────────────────────────────────────────────────────
const MongoStore = require('connect-mongo');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    // use the same MongoDB URI you already have in .env
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      // Optional settings:
      collectionName: 'sessions',   // the collection in your DB where sessions are stored
      ttl: 24 * 60 * 60,            // session lifetime in seconds (1 day)
    }),
    secret: process.env.SESSION_SECRET || 'change_this_to_a_long_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
  })
);


// ─── 3) Protect admin/dashboard.html and admin/users.html ──────────────────────
//    If the admin is not logged in (no req.session.admin), redirect to login.
app.get('/admin/dashboard.html', (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login.html');
  }
  next();
});
app.get('/admin/users.html', (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login.html');
  }
  next();
});

// ─── 4) Serve static files from /public ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── 5) API Routes ─────────────────────────────────────────────────────────────

// GET /users → returns all user documents
app.get('/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /users → insert a new user
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    const db = req.app.locals.db;
    const result = await db.collection('users').insertOne({
      name,
      email,
      joined: new Date()
    });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('POST /users error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─── 6) Admin Login/Logout Routes ──────────────────────────────────────────────

// Serve the login page (now as a static file: /public/admin/login.html)
app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// Handle login form submissions
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = req.app.locals.db;
    const adminUsers = db.collection('admin_users');
    const user = await adminUsers.findOne({ username });
    if (!user) {
      return res.status(401).send('User not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send('Invalid password');
    }
    // Success: store username in session
    req.session.admin = user.username;
    return res.redirect('/admin/dashboard.html');
  } catch (err) {
    console.error('POST /admin/login error:', err);
    return res.status(500).send('Server error');
  }
});

// Handle logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login.html');
  });
});

// ─── 7) Admin Dashboard Route ──────────────────────────────────────────────────
//    Because static middleware will serve /public/admin/dashboard.html, the
//    above guard ensures only logged-in admins get here. No need to res.sendFile again.

// ─── 8) 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── 9) Start the Server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
