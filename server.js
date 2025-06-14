// server.js

// 1) Dependencies
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const MongoStore    = require('connect-mongo');
require('dotenv').config();

// 2) Create the app
const app   = express();
const PORT  = process.env.PORT || 3000;

// 3) Static folders
app.use('/css',    express.static(path.join(__dirname, 'public', 'css')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/admin/css', express.static(path.join(__dirname, 'public', 'admin', 'css')));
app.use(express.static(path.join(__dirname, 'public')));

// 4) Database connection helper
let dbInstance;
async function connectToDatabase() {
  if (dbInstance) return dbInstance;
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas');
  dbInstance = client.db(); // uses database name from URI
  return dbInstance;
}

// 5) Attach db to each request
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

// 6) Body parsing & sessions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 24*60*60 }),
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24*60*60*1000 }
  })
);

// 7) Auth guard
function ensureAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login.html');
}

// 8) Admin Auth routes
app.get('/admin/login.html', /* … */);
app.get('/admin/logout', /* … */);

// 9) Admin pages
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/dashboard.html', ensureAdminLoggedIn, /* … */);
app.get('/admin/users.html',      ensureAdminLoggedIn, /* … */);
app.get('/admin/products.html',   ensureAdminLoggedIn, /* … */);


app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/admin/login.html?error=Both+fields+required');
  try {
    const user = await req.app.locals.db.collection('admin_users').findOne({ username });
    if (!user || user.password !== password) {
      return res.redirect('/admin/login.html?error=Invalid+credentials');
    }
    req.session.admin = user.username;
    res.redirect('/admin/dashboard.html');
  } catch (err) {
    console.error('POST /admin/login error:', err);
    res.status(500).send('Server error');
  }
});

app.get('/admin/logout', (req, res) =>
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/admin/login.html');
  })
);

// 9) Admin pages
app.get('/admin/dashboard.html', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'))
);
app.get('/admin/users.html', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'users.html'))
);
app.get('/admin/products.html', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'))
);
// ← Insert your alias HERE:
app.get('/admin/users', ensureAdminLoggedIn, (req, res) => {
  res.redirect('/admin/users.html');
});
app.get('/admin/users', ensureAdminLoggedIn, (req, res) => {
  res.redirect('/admin/products.html');
});

// 10) User API
app.get('/users', async (req, res) => {
  try {
    const users = await req.app.locals.db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name & email required' });
    const result = await req.app.locals.db.collection('users').insertOne({ name, email, joined: new Date() });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('POST /users error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.delete('/users/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 11) Product API
app.get('/products', async (req, res) => {
  try {
    const products = await req.app.locals.db.collection('products').find().toArray();
    res.json(products);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.get('/products/:id', async (req, res) => {
  try {
    const prod = await req.app.locals.db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
    if (!prod) return res.status(404).json({ message: 'Not found' });
    res.json(prod);
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.post('/products', async (req, res) => {
  try {
    const result = await req.app.locals.db.collection('products').insertOne({ ...req.body, createdAt: new Date() });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.put('/products/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.delete('/products/:id', async (req, res) => {
  try {
    await req.app.locals.db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 12) 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 13) Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
