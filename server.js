const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse URL-encoded data (form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // ← Add this here


// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submissions (e.g., order submission)
app.post('/submit-order', (req, res) => {
  console.log('Order data received:', req.body);
  res.send('Order received! Thank you.');
});

// Handle 404 - Page not found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
