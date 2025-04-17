const { MongoClient } = require('mongodb');

let client;

const connectToDb = async () => {
  if (client) {
    console.log('Using existing MongoDB connection');
    return client;
  }

  console.log('Connecting to MongoDB...');
  client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    maxPoolSize: 10,
  });

  try {
    await client.connect();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw new Error('Failed to connect to MongoDB');
  }

  return client;
};

module.exports = { connectToDb };