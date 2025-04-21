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
  if (!client) throw new Error('MongoDB client is not connected');

  const db = client.db('tg_db');
  const collection = db.collection('messages');

  try {
    // Get the start and end of the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00.000
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59.999

    const messages = await collection
      .find({
        chatId,
        createdAt: { $gte: startOfDay, $lt: endOfDay }, // Filter by current day
      })
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