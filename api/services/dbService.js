import { MongoClient } from 'mongodb';

import { encryptText, decryptText } from '../utils/crypto.js';
import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

let clientPromise; // Use a promise to avoid race conditions

const DB_NAME = 'tg_db';
const COLLECTION_NAME = 'messages';
const BOT_NAME = "AI_Chat_bot"

// Singleton connection using a promise
export const connectToDb = async () => {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new MongoClient(process.env.MONGO_URI, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        maxPoolSize: 20, // Increased pool size for more concurrency
        minPoolSize: 2,  // Optional: keep some connections always open
      });
      await client.connect();
      console.log('MongoDB connected successfully.');
      return client;
    })();
  }
  return clientPromise;
};

const getClient = async () => {
  const client = await connectToDb();
  if (!client) throw new Error('MongoDB client is not connected.');
  return client;
};

export const getMessagesFromDb = async (chatId, limit = 50) => {
  const client = await getClient();

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  try {
    const messages = await collection
      .find({ chatId })
      .sort({ _id: -1 }) // Get latest messages first
      .limit(limit)
      .toArray();

    return messages.reverse(); // Reverse to get chronological order (oldest to newest)
  } catch (err) {
    console.error(`Error fetching messages for chatId ${chatId}:`, err);
    throw new Error('Failed to fetch messages from DB.');
  }
}

export const insertAIResponseToDb = async (ctx, response) => {
  if (!response) return;

  const client = await getClient();

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const encryptedText = encryptText(response);

  await collection.insertOne({
    chatId: ctx.message.chat.id,
    message: encryptedText,
    userName: BOT_NAME,
    createdAt: new Date(),
  });
}

export const insertMessageToDb = async (body) => {
  const client = await getClient();

  const messageData = extractMessageData(body);

  if (!messageData) return;

  const { chatId, text, userName } = messageData;

  // Encrypt the message text before inserting
  const encryptedText = encryptText(text);

  await client.db(DB_NAME).collection(COLLECTION_NAME).insertOne({
    chatId,
    message: encryptedText,
    userName,
    createdAt: new Date(),
  });
};

// Helper function to extract message data
export const extractMessageData = (body) => {
  if (!body?.message) return null;

  const text = getMessage(body);
  const userName = body.message?.from?.first_name || body.message?.from?.username;
  const chatId = body.message?.chat?.id;

  if (!text || !userName || !chatId) return null;

  return {
    chatId,
    text,
    userName,
  };
};

export const buildAIHistory = async (ctx) => {
  const messages = await getMessagesFromDb(ctx.message.chat.id, 20);

  // Decrypt messages and categorize them into user and model roles
  const { user, model } = messages.reduce(
    (acc, message) => {
      const decryptedMessage = {
        userName: message.userName,
        message: decryptText(message.message),
      };

      if (decryptedMessage.userName === BOT_NAME) {
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
  const history = [
    {
      role: 'user',
      parts: user,
    },
    {
      role: 'model',
      parts: model.length === 0 ? [{ text: "Good to know." }] : model,
    },
  ];

  log(history, `Built AI history for chatId ${ctx.message.chat.id}:`);

  return history
};