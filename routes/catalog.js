const express = require('express');
const router  = express.Router();
const { ObjectId } = require('mongodb');

router.get('/', async (req, res) => {
  const productsColl = req.app.locals.db.collection('products');
  const { cat: categoryFilter, price: priceFilter, page = 1 } = req.query;
  const currentPage = Math.max(parseInt(page, 10), 1);
  const skip        = (currentPage - 1) * 8;

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

module.exports = router;
