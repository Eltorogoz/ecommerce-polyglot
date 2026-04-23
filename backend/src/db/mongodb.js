const mongoose = require('mongoose');

let isConnected = false;

async function connectMongoDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('xxxxx') || uri.includes('PASSWORD')) {
    console.warn('MONGODB_URI not configured, skipping MongoDB connection');
    console.warn('MongoDB features will be unavailable until you update .env');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('MongoDB features will be unavailable');
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected');
});

async function testConnection() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectMongoDB,
  testConnection,
  mongoose,
};
