// server.js
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const MongoStore    = require('connect-mongo');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// 1) Static assets
app.use('/css',      express.static(path.join(__dirname, 'public', 'css')));
app.use('/assets',   express.static(path.join(__dirname, 'public', 'assets')));
app.use('/admin/css',express.static(path.join(__dirname, 'public', 'admin', 'css')));
app.use(express.static(path.join(__dirname, 'public')));

// 2) DB connection helper
let dbInstance;
async function connectToDatabase() {
  if (dbInstance) return dbInstance;
  const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas');
  dbInstance = client.db();  // uses DB name from URI
  return dbInstance;
}

// 3) Attach db to each request
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

// 4) Body parsers & session
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 86400 }),
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 86400 * 1000 }
}));

// 5) Auth guard
function ensureAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login.html');
}

// 6) Auth routes
// Serve login form
app.get('/admin/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'))
);

// Handle login submit
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/admin/login.html?error=Both+fields+required');
  }
  try {
    const user = await req.app.locals.db.collection('admin_users').findOne({ username });
    if (!user || user.password !== password) {
      return res.redirect('/admin/login.html?error=Invalid+credentials');
    }
    req.session.admin = user.username;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('POST /admin/login error:', err);
    res.status(500).send('Server error');
  }
});

// Logout
app.get('/admin/logout', (req, res) =>
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/admin/login.html');
  })
);

// 7) Alias routes (protected)
// Dashboard
app.get('/admin/dashboard', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'))
);

// Manage Users
app.get('/admin/users', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'users.html'))
);

// Manage Products
app.get('/admin/products', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'))
);

// 8) Public API routes (no .html)
// Users API
app.get('/users',      async (req, res) => {
  const users = await req.app.locals.db.collection('users').find().toArray();
  res.json(users);
});
app.post('/users',     async (req, res) => {
  const { name, email } = req.body;
  const result = await req.app.locals.db.collection('users').insertOne({ name, email, joined: new Date() });
  res.status(201).json({ _id: result.insertedId });
});
app.delete('/users/:id', async (req, res) => {
  await req.app.locals.db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
  res.sendStatus(204);
});

// Products API
app.get('/products',      async (req, res) => {
  const prods = await req.app.locals.db.collection('products').find().toArray();
  res.json(prods);
});
app.get('/products/:id',  async (req, res) => {
  const prod = await req.app.locals.db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
  if (!prod) return res.status(404).json({ message: 'Not found' });
  res.json(prod);
});
app.post('/products',     async (req, res) => {
  const result = await req.app.locals.db.collection('products')
    .insertOne({ ...req.body, createdAt: new Date() });
  res.status(201).json({ _id: result.insertedId });
});
app.put('/products/:id',  async (req, res) => {
  await req.app.locals.db.collection('products')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
  res.sendStatus(204);
});
app.delete('/products/:id', async (req, res) => {
  await req.app.locals.db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
  res.sendStatus(204);
});





// …

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Alias for index
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Alias for catalog
app.get('/catalog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Alias for order
app.get('/admin/orders', ensureAdminLoggedIn, (req,res)=>
  res.sendFile(path.join(__dirname,'public','admin','orders.html'))
);

const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

// serve admin‐only scripts
app.use(
  '/admin/js',
  express.static(path.join(__dirname, 'public', 'admin', 'js'))
);

// 9) 404 handler
app.use((req, res) =>
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
);

// 10) Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
