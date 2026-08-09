const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leet_eval';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.log(`[MongoDB Connection Warning]: ${error.message}.`);
  }
};

const checkDBConnected = async (req, res, next) => {
  // If database is currently establishing connection (readyState === 2), wait up to 3s
  if (mongoose.connection.readyState === 2) {
    let attempts = 0;
    while (mongoose.connection.readyState === 2 && attempts < 15) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }
  }

  // If disconnected (readyState === 0), trigger auto-reconnect
  if (mongoose.connection.readyState === 0) {
    connectDB().catch(() => {});
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 15) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is re-connecting to MongoDB Atlas. Please retry your action in 2 seconds.'
    });
  }
  next();
};

const getDBStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { status: 'Disconnected', dataSize: 0, storageSize: 0, collections: 0 };
    }
    const db = mongoose.connection.db;
    const stats = await db.stats();
    return {
      status: 'Connected',
      dataSizeMb: (stats.dataSize / (1024 * 1024)).toFixed(2),
      storageSizeMb: (stats.storageSize / (1024 * 1024)).toFixed(2),
      objectsCount: stats.objects,
      collectionsCount: stats.collections
    };
  } catch (err) {
    return { status: 'Error', error: err.message };
  }
};

module.exports = { connectDB, checkDBConnected, getDBStats };
