const { MongoClient } = require('mongodb');

const { encryptText, decryptText } = require('../utils/crypto');
const { clearText } = require('../utils/text');

let client;

const DB_NAME = 'tg_db';
const COLLECTION_NAME = 'messages';

const connectToDb = async () => {
  if (client) {
    console.log('Using existing MongoDB connection.');
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
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw new Error('Failed to connect to MongoDB.');
  }

  return client;
};

const getMessagesFromDb = async (chatId, limit = 50) => {
  if (!client) throw new Error('MongoDB client is not connected.');

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  try {
    const messages = await collection
      .find({ chatId })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return messages;
  } catch (error) {
    console.error(`Error fetching messages for chatId ${chatId}:`, error);
    throw new Error('Failed to fetch messages from DB.');
  }
}

const insertAIResponseToDb = async (ctx, response) => {
  if (!client) throw new Error('MongoDB client is not connected.');

  if (!response) return;

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const encryptedText = encryptText(response);

  await collection.insertOne({
    chatId: ctx.message.chat.id,
    message: encryptedText,
    userName: "AI_Chat_bot",
    createdAt: new Date(),
  });
}

const insertMessageToDb = async (body) => {
  if (!client) throw new Error('MongoDB client is not connected.');

  const messageData = extractMessageData(body);

  if (!messageData) return;

  const { chatId, text, userName } = messageData;

  const clearedText = clearText(text)

  if (!clearedText) return;

  // Encrypt the message text before inserting
  const encryptedText = encryptText(clearedText);

  await client.db(DB_NAME).collection(COLLECTION_NAME).insertOne({
    chatId,
    message: encryptedText,
    userName,
    createdAt: new Date(),
  });
};

// Helper function to extract message data
const extractMessageData = (body) => {
  const message = body?.message || body?.edited_message;

  if (!message || !message.chat?.id || !message.text) return null;

  const userName = message.from?.first_name || message.from?.username;

  return {
    chatId: message.chat.id,
    text: message.text,
    userName,
  };
};

const buildAIHistory = async (ctx) => {
  const messages = await getMessagesFromDb(ctx.message.chat.id, 30);

  // Decrypt messages and categorize them into user and model roles
  const { user, model } = messages.reduce(
    (acc, message) => {
      const decryptedMessage = {
        userName: message.userName,
        message: decryptText(message.message),
      };

      if (decryptedMessage.userName === "AI_Chat_bot") {
        acc.model.push({ text: decryptedMessage.message });
      } else {
        acc.user.push({ text: decryptedMessage.message });
      }

      return acc;
    },
    { user: [], model: [] } // Initial accumulator
  );

  // Return an empty array if no messages exist
  if (user.length === 0 && model.length === 0) {
    return [];
  }

  // Build and return the history
  return [
    {
      role: 'user',
      parts: user,
    },
    {
      role: 'model',
      parts: model.length === 0 ? [{ text: "Good to know." }] : model,
    },
  ];
};

module.exports = { connectToDb, getMessagesFromDb, insertAIResponseToDb, buildAIHistory, insertMessageToDb };