const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('PG Query:', { text: text.slice(0, 80), duration, rows: result.rowCount });
  }
  return result;
}

async function getClient() {
  return pool.connect();
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', res.rows[0].now);
    return true;
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
