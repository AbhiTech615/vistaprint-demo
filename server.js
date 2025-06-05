// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── A) Connect to MongoDB (must run before any route that uses req.app.locals.db) ───────────────
let dbInstance;
async function connectToDatabase() {
  if (dbInstance) return dbInstance;
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas');
  dbInstance = client.db(); // uses the database name from MONGODB_URI (e.g. “vistaprintdb”)
  return dbInstance;
}

app.use(async (req, res, next) => {
  if (!req.app.locals.db) {
    try {
      req.app.locals.db = await connectToDatabase();
    } catch (err) {
      console.error('🔴 MongoDB connection error:', err);
      return res.status(500).send('DB connection error');
    }
  }
  next();
});

// ─── B) Body parsing + Sessions ───────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
    }),
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// ─── C) Login guard ────────────────────────────────────────────────────────────
function ensureAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.redirect('/admin/login.html');
}

// ─── D) Admin Login/Logout/Dashboard ──────────────────────────────────────────

// 1) Serve the login form
app.get('/admin/login.html', (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// 2) Handle login POST
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect(
      '/admin/login.html?error=' + encodeURIComponent('Both fields are required.')
    );
  }
  try {
    const adminUsers = req.app.locals.db.collection('admin_users');
    const user = await adminUsers.findOne({ username });
    if (!user || user.password !== password) {
      return res.redirect(
        '/admin/login.html?error=' + encodeURIComponent('Invalid username or password.')
      );
    }
    // Successful login → set session and redirect
    req.session.admin = user.username;
    return res.redirect('/admin/dashboard.html');
  } catch (err) {
    console.error('POST /admin/login error:', err);
    return res.status(500).send('Server error');
  }
});

// 3) Serve the protected dashboard
app.get('/admin/dashboard.html', ensureAdminLoggedIn, (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// 4) Handle logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    return res.redirect('/admin/login.html');
  });
});

// ─── E) API Routes for “users” ─────────────────────────────────────────────────

// GET /users → returns all user documents (to feed the dashboard)
app.get('/users', async (req, res) => {
  try {
    const users = await req.app.locals.db.collection('users').find({}).toArray();
    return res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /users → insert a new user (used by a form or API somewhere)
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    const result = await req.app.locals.db
      .collection('users')
      .insertOne({ name, email, joined: new Date() });
    return res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('POST /users error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /users/:id → remove a user by _id
app.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await req.app.locals.db.collection('users').deleteOne({ _id: new ObjectId(id) });
    return res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─── F) Serve static files (after all routes above) ───────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── G) 404 Handler (last) ─────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── H) Start server ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
