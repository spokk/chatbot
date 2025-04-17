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

const getMessagesFromDb = async (chatId, limit) => {
  if (!client) {
    throw new Error('MongoDB client is not connected');
  }

  const db = client.db('tg_db');
  const collection = db.collection('messages');

  try {
    const messages = await collection
      .find({ chatId })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return messages;
  } catch (error) {
    console.error('Error fetching messages from DB:', error);
    throw new Error('Failed to fetch messages from DB');
  }
}

module.exports = { connectToDb, getMessagesFromDb };