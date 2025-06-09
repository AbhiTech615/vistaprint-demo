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

// 3) View engine + static folders
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
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
  dbInstance = client.db(); 
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
app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// 7) Auth guard
function ensureAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login.html');
}

// 8) Admin routes
app.get('/admin/login.html', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'))
);

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/admin/login.html?error=Both fields required');
  }
  const user = await req.app.locals.db
    .collection('admin_users')
    .findOne({ username });
  if (!user || user.password !== password) {
    return res.redirect('/admin/login.html?error=Invalid credentials');
  }
  req.session.admin = user.username;
  res.redirect('/admin/dashboard.html');
});

app.get('/admin/dashboard.html', ensureAdminLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'))
);

app.get('/admin/logout', (req, res) =>
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/admin/login.html');
  })
);

// 9) User API
app.get('/users', async (req, res) => {
  const users = await req.app.locals.db.collection('users').find().toArray();
  res.json(users);
});
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name & email required' });
  const result = await req.app.locals.db
    .collection('users')
    .insertOne({ name, email, joined: new Date() });
  res.status(201).json({ _id: result.insertedId });
});
app.delete('/users/:id', async (req, res) => {
  await req.app.locals.db
    .collection('users')
    .deleteOne({ _id: new ObjectId(req.params.id) });
  res.sendStatus(204);
});

// 10) Product API
app.get('/products', async (req, res) => {
  const prods = await req.app.locals.db.collection('products').find().toArray();
  res.json(prods);
});
app.get('/products/:id', async (req, res) => {
  const prod = await req.app.locals.db
    .collection('products')
    .findOne({ _id: new ObjectId(req.params.id) });
  if (!prod) return res.status(404).json({ message: 'Not found' });
  res.json(prod);
});

// 11) Catalog route
 const catalogRouter = require('./routes/catalog');
 app.use('/catalog', catalogRouter);

  app.get('/catalog', async (req, res) => {
  // now await is valid here
  const productsColl = req.app.locals.db.collection('products');
  const { cat: categoryFilter, price: priceFilter, page = 1 } = req.query;
  const currentPage = Math.max(parseInt(page, 10), 1);
  const skip        = (currentPage - 1) * 8;

  // Build query
  const query = { is_active: true };
  if (categoryFilter) query.category = categoryFilter;
  if (priceFilter) {
    if (priceFilter.endsWith('+')) {
      query['price_range.min'] = { $gte: parseInt(priceFilter, 10) };
    } else {
      const [min, max] = priceFilter.split('-').map(Number);
      query['price_range.min'] = { $gte: min };
      query['price_range.max'] = { $lte: max };
    }
  }

  const totalCount = await productsColl.countDocuments(query);
  const totalPages = Math.ceil(totalCount / 8);
  const products   = await productsColl
    .find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(8)
    .toArray();

  let baseUrl = '/catalog?';
  if (categoryFilter) baseUrl += `cat=${encodeURIComponent(categoryFilter)}&`;
  if (priceFilter)    baseUrl += `price=${encodeURIComponent(priceFilter)}&`;

  res.render('catalog', {
    products,
    currentPage,
    totalPages,
    categoryFilter,
    priceFilter,
    baseUrl
  });
});

// 12) 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 13) Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
