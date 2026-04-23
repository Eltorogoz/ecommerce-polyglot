const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectMongoDB, testConnection: testMongo } = require('./db/mongodb');
const { testConnection: testPostgres } = require('./db/postgres');

const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const reviewsRouter = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  const postgresOk = await testPostgres();
  const mongoOk = await testMongo();

  res.json({
    ok: true,
    postgres: postgresOk,
    mongodb: mongoOk,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/reviews', reviewsRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

async function startServer() {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('  GET  /api/health');
    console.log('  CRUD /api/users');
    console.log('  CRUD /api/orders');
    console.log('  CRUD /api/products');
    console.log('  CRUD /api/reviews');
    console.log('  GET  /api/products/analytics/top-rated');
    console.log('  GET  /api/products/:id/rating-summary');
  });
}

startServer();
