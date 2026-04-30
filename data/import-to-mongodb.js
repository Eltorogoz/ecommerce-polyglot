/**
 * Import products and reviews to MongoDB via the API
 * Make sure backend is running first!
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001';

async function importData() {
  console.log('=== MongoDB Import ===\n');
  
  const productsFile = path.join(__dirname, 'mongodb_products.json');
  const reviewsFile = path.join(__dirname, 'mongodb_reviews.json');
  
  if (!fs.existsSync(productsFile)) {
    console.error('mongodb_products.json not found. Run transform-olist.js first.');
    process.exit(1);
  }
  
  const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  const reviews = fs.existsSync(reviewsFile) ? JSON.parse(fs.readFileSync(reviewsFile, 'utf8')) : [];
  
  console.log(`Importing ${products.length} products and ${reviews.length} reviews...\n`);
  
  const productIdMap = new Map();
  let productOk = 0, productFail = 0;
  
  for (const product of products) {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: product.name, description: product.description, price: product.price, category: product.category, stock: product.stock })
      });
      if (res.ok) {
        const created = await res.json();
        productIdMap.set(product._id, created._id);
        productOk++;
      } else { productFail++; }
    } catch (e) { productFail++; }
  }
  console.log(`Products: ${productOk} imported, ${productFail} failed`);
  
  let reviewOk = 0, reviewFail = 0;
  for (const review of reviews) {
    try {
      const newProductId = productIdMap.get(review.productId);
      if (!newProductId) { reviewFail++; continue; }
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: newProductId, userId: review.userId, rating: review.rating, title: review.title, comment: review.comment })
      });
      if (res.ok) { reviewOk++; } else { reviewFail++; }
    } catch (e) { reviewFail++; }
  }
  console.log(`Reviews: ${reviewOk} imported, ${reviewFail} failed`);
  
  console.log('\nDone! Visit http://localhost:3000 to see your data.');
}

importData().catch(console.error);
