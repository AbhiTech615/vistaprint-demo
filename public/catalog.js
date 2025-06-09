const express = require('express');
const router = express.Router();

// Constants
const PAGE_SIZE = 8; // number of products per page

// GET /catalog
router.get('/', async (req, res) => {
  try {
    const db = req.db;

    // 1. Extract query parameters: category, price, page
    //    Example URLs:
    //      /catalog?cat=business-cards
    //      /catalog?price=200-499
    //      /catalog?page=2&cat=mugs
    const categoryFilter = req.query.cat || null;    // e.g. 'business-cards'
    const priceFilter = req.query.price || null;      // e.g. '200-499'
    let page = parseInt(req.query.page, 10) || 1;      // default to 1
    if (page < 1) page = 1;
    const offset = (page - 1) * PAGE_SIZE;

    // 2. Build WHERE clauses (only include filters if provided)
    let whereClauses = ['is_active = 1']; // show only active products
    let queryParams = [];

    if (categoryFilter) {
      whereClauses.push('category = ?');
      queryParams.push(categoryFilter);
    }

    if (priceFilter) {
      // Expecting format 'min-max', e.g. '200-499' or '1000+'
      if (priceFilter.includes('+')) {
        const minVal = parseInt(priceFilter.replace('+', ''), 10);
        whereClauses.push('price_range_min >= ?');
        queryParams.push(minVal);
      } else {
        const [minVal, maxVal] = priceFilter.split('-').map(v => parseInt(v, 10));
        whereClauses.push('price_range_min >= ? AND price_range_max <= ?');
        queryParams.push(minVal, maxVal);
      }
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // 3. Count total results (for pagination)
    const countSql = `SELECT COUNT(*) AS totalCount FROM products ${whereSQL}`;
    const [countRows] = await db.query(countSql, queryParams);
    const totalCount = countRows[0].totalCount;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 4. Fetch the products for this page
    const dataSql = `
      SELECT id, name, slug, category, thumbnail, starting_price 
      FROM products
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    // Append pagination params at end
    const dataParams = queryParams.slice(); // copy array
    dataParams.push(PAGE_SIZE, offset);

    const [productRows] = await db.query(dataSql, dataParams);

    // 5. Build “canonical” URL for pagination links (so we keep cat/price filters)
    let baseUrl = '/catalog?';
    if (categoryFilter) baseUrl += `cat=${encodeURIComponent(categoryFilter)}&`;
    if (priceFilter)    baseUrl += `price=${encodeURIComponent(priceFilter)}&`;
    // We’ll append `page=…` when rendering

    // 6. Render the EJS template, passing products and pagination info
    res.render('catalog', {
      products: productRows,
      currentPage: page,
      totalPages,
      categoryFilter,
      priceFilter,
      baseUrl
    });
  } catch (err) {
    console.error('Error in /catalog route:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
