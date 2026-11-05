import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config.js';

let memoryServer;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  const uri = config.mongoUri || process.env.MONGO_URI || await getMemoryMongoUri();

  try {
    await mongoose.connect(uri, {
      autoIndex: true
    });
    return mongoose.connection.db;
  }
  catch (error) {
    console.warn('MongoDB connection failed, falling back to in-memory demo mode:', error.message);
    return null;
  }
}

async function getMemoryMongoUri() {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  return memoryServer.getUri();
}

export function normalizeDate(date) {
  return date ? new Date(date).toISOString() : new Date().toISOString();
}
