const mongoose = require('mongoose');

let isInMemoryMode = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_blog_db';
  try {
    // Attempt connecting to real MongoDB with 3s timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}`);
    isInMemoryMode = false;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to real MongoDB (${error.message}). Switching to High-Performance Memory DB Engine.`);
    isInMemoryMode = true;
  }
};

const getDBMode = () => isInMemoryMode;

module.exports = { connectDB, getDBMode };
