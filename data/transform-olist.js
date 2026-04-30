/**
 * Transform Brazilian E-Commerce (Olist) Dataset
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FIRST_NAMES = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];
const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

function randomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInRange(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function hashPassword(password) { return crypto.createHash('sha256').update(password).digest('hex'); }

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '', inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/"/g, '')); current = ''; }
      else current += char;
    }
    values.push(current.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function toCSV(data, columns) {
  const header = columns.join(',');
  const rows = data.map(row => columns.map(col => {
    const val = row[col];
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }).join(','));
  return [header, ...rows].join('\n');
}

async function main() {
  console.log('=== Olist Data Transformer ===\n');
  const dataDir = __dirname;
  
  // Load category translations
  const categoryTranslations = new Map();
  try {
    const catData = parseCSV(fs.readFileSync(path.join(dataDir, 'product_category_name_translation.csv'), 'utf8'));
    catData.forEach(row => categoryTranslations.set(row.product_category_name, row.product_category_name_english));
  } catch (e) { console.log('No category translation file, using defaults'); }

  const MAX_ORDERS = 300, MAX_PRODUCTS = 100;

  console.log('Loading datasets...');
  const allCustomers = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_customers_dataset.csv'), 'utf8'));
  const allOrders = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_orders_dataset.csv'), 'utf8'));
  const allOrderItems = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_order_items_dataset.csv'), 'utf8'));
  const allProducts = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_products_dataset.csv'), 'utf8'));
  const allPayments = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_order_payments_dataset.csv'), 'utf8'));
  const allReviews = parseCSV(fs.readFileSync(path.join(dataDir, 'olist_order_reviews_dataset.csv'), 'utf8'));

  console.log(`  ${allCustomers.length} customers, ${allOrders.length} orders, ${allOrderItems.length} items, ${allProducts.length} products`);

  // Start from order_items to ensure connected data
  const orderIdsWithItems = new Set(allOrderItems.map(oi => oi.order_id));
  const ordersWithItems = allOrders.filter(o => orderIdsWithItems.has(o.order_id)).slice(0, MAX_ORDERS);
  
  const selectedCustomerIds = new Set(ordersWithItems.map(o => o.customer_id));
  const customers = allCustomers.filter(c => selectedCustomerIds.has(c.customer_id));

  const customerIdMap = new Map();
  customers.forEach((c, idx) => customerIdMap.set(c.customer_id, idx + 1));

  const orderIdMap = new Map();
  const filteredOrders = ordersWithItems.filter(o => customerIdMap.has(o.customer_id));
  filteredOrders.forEach((o, idx) => orderIdMap.set(o.order_id, idx + 1));

  const selectedOrderIds = new Set(filteredOrders.map(o => o.order_id));
  const relevantOrderItems = allOrderItems.filter(oi => selectedOrderIds.has(oi.order_id));
  const selectedProductIds = new Set(relevantOrderItems.map(oi => oi.product_id));

  const products = allProducts.filter(p => selectedProductIds.has(p.product_id)).slice(0, MAX_PRODUCTS);
  const productIdMap = new Map();
  products.forEach((p, idx) => productIdMap.set(p.product_id, `prod_${String(idx + 1).padStart(6, '0')}`));

  const filteredOrderItems = relevantOrderItems.filter(oi => orderIdMap.has(oi.order_id) && productIdMap.has(oi.product_id));

  console.log(`\nSelected: ${customers.length} users, ${filteredOrders.length} orders, ${filteredOrderItems.length} items, ${products.length} products`);

  // Generate USERS
  const users = customers.map((c, idx) => {
    const fn = randomElement(FIRST_NAMES), ln = randomElement(LAST_NAMES);
    return { id: idx + 1, email: `${fn.toLowerCase()}.${ln.toLowerCase()}${idx + 1}@${randomElement(DOMAINS)}`, password_hash: hashPassword('demo123'), name: `${fn} ${ln}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  });

  // Generate ORDERS
  const statusMap = { 'delivered': 'delivered', 'shipped': 'shipped', 'processing': 'processing', 'invoiced': 'processing', 'created': 'pending', 'approved': 'pending', 'canceled': 'cancelled' };
  const orders = filteredOrders.map((o, idx) => ({
    id: idx + 1, user_id: customerIdMap.get(o.customer_id), status: statusMap[o.order_status] || 'pending', total_amount: 0,
    shipping_address: `${randomInRange(100, 9999)} Street, City, ST ${randomInRange(10000, 99999)}`, created_at: o.order_purchase_timestamp || new Date().toISOString(), updated_at: o.order_purchase_timestamp || new Date().toISOString()
  }));

  // Generate PRODUCTS (MongoDB)
  const mongoProducts = products.map((p, idx) => {
    const cat = categoryTranslations.get(p.product_category_name) || p.product_category_name || 'General';
    const weight = parseFloat(p.product_weight_g) || 500;
    const price = 15 + (weight / 100) + randomInRange(5, 50);
    return { _id: productIdMap.get(p.product_id), name: `${cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')} Item #${idx + 1}`, description: `Quality ${cat.replace(/_/g, ' ')} product.`, price: parseFloat(price.toFixed(2)), category: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '), stock: randomInRange(10, 200), isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  });

  // Generate ORDER_ITEMS
  const orderItems = [], orderTotals = new Map();
  filteredOrderItems.forEach((oi, idx) => {
    const orderId = orderIdMap.get(oi.order_id), productId = productIdMap.get(oi.product_id);
    if (!orderId || !productId) return;
    const product = mongoProducts.find(p => p._id === productId);
    const price = parseFloat(oi.price) || product?.price || 29.99;
    const qty = parseInt(oi.order_item_id) || 1;
    orderItems.push({ id: idx + 1, order_id: orderId, product_id: productId, product_name: product?.name || 'Product', quantity: qty, unit_price: price.toFixed(2), created_at: new Date().toISOString() });
    orderTotals.set(orderId, (orderTotals.get(orderId) || 0) + price * qty);
  });
  orders.forEach(o => { o.total_amount = (orderTotals.get(o.id) || 0).toFixed(2); });

  // Generate PAYMENTS
  const paymentMethodMap = { 'credit_card': 'credit_card', 'boleto': 'bank_transfer', 'voucher': 'debit_card', 'debit_card': 'debit_card' };
  const payments = [], seenOrders = new Set();
  allPayments.filter(p => orderIdMap.has(p.order_id)).forEach(p => {
    const orderId = orderIdMap.get(p.order_id);
    if (seenOrders.has(orderId)) return;
    seenOrders.add(orderId);
    payments.push({ id: payments.length + 1, order_id: orderId, amount: parseFloat(p.payment_value || 0).toFixed(2), payment_method: paymentMethodMap[p.payment_type] || 'credit_card', status: 'completed', transaction_id: `TXN${Date.now()}${payments.length}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  });

  // Generate REVIEWS (MongoDB)
  const orderToProducts = new Map(), orderToUser = new Map();
  filteredOrderItems.forEach(oi => { const oid = orderIdMap.get(oi.order_id), pid = productIdMap.get(oi.product_id); if (oid && pid) { if (!orderToProducts.has(oid)) orderToProducts.set(oid, []); orderToProducts.get(oid).push(pid); }});
  filteredOrders.forEach(o => { const oid = orderIdMap.get(o.order_id), uid = customerIdMap.get(o.customer_id); if (oid && uid) orderToUser.set(oid, uid); });

  const mongoReviews = [], reviewedPairs = new Set();
  allReviews.filter(r => orderIdMap.has(r.order_id)).slice(0, 300).forEach(r => {
    const orderId = orderIdMap.get(r.order_id), productIds = orderToProducts.get(orderId) || [], userId = orderToUser.get(orderId);
    if (!userId || !productIds.length) return;
    const productId = productIds[0], pairKey = `${userId}_${productId}`;
    if (reviewedPairs.has(pairKey)) return;
    reviewedPairs.add(pairKey);
    const user = users.find(u => u.id === userId), rating = parseInt(r.review_score) || randomInRange(3, 5);
    mongoReviews.push({ _id: `rev_${String(mongoReviews.length + 1).padStart(6, '0')}`, productId, userId, userName: user?.name || 'Anonymous', rating, title: r.review_comment_title || (rating >= 4 ? 'Great!' : 'OK'), comment: r.review_comment_message || 'Good product.', helpfulVotes: randomInRange(0, 20), isVerifiedPurchase: true, createdAt: r.review_creation_date || new Date().toISOString(), updatedAt: new Date().toISOString() });
  });

  console.log(`\nGenerated: ${users.length} users, ${orders.length} orders, ${orderItems.length} items, ${payments.length} payments, ${mongoProducts.length} products, ${mongoReviews.length} reviews`);

  // Save files
  fs.writeFileSync(path.join(dataDir, 'supabase_users.csv'), toCSV(users, ['id', 'email', 'password_hash', 'name', 'created_at', 'updated_at']));
  fs.writeFileSync(path.join(dataDir, 'supabase_orders.csv'), toCSV(orders, ['id', 'user_id', 'status', 'total_amount', 'shipping_address', 'created_at', 'updated_at']));
  fs.writeFileSync(path.join(dataDir, 'supabase_order_items.csv'), toCSV(orderItems, ['id', 'order_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'created_at']));
  fs.writeFileSync(path.join(dataDir, 'supabase_payments.csv'), toCSV(payments, ['id', 'order_id', 'amount', 'payment_method', 'status', 'transaction_id', 'created_at', 'updated_at']));
  fs.writeFileSync(path.join(dataDir, 'mongodb_products.json'), JSON.stringify(mongoProducts, null, 2));
  fs.writeFileSync(path.join(dataDir, 'mongodb_reviews.json'), JSON.stringify(mongoReviews, null, 2));

  console.log('\nFiles saved! Import to Supabase in order: users -> orders -> order_items -> payments');
  console.log('Then run: node import-to-mongodb.js');
}

main().catch(console.error);
