import { MongoClient } from 'mongodb';

import { encryptText, decryptText } from '../utils/crypto.js';
import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

let clientPromise; // Use a promise to avoid race conditions

const DB_NAME = 'tg_db';
const COLLECTION_NAME = 'messages';
const BOT_NAME = "AI_Chat_bot"
const USER_NAME = "User"

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

  const { chatId, text } = messageData;

  // Encrypt the message text before inserting
  const encryptedText = encryptText(text);

  await client.db(DB_NAME).collection(COLLECTION_NAME).insertOne({
    chatId,
    message: encryptedText,
    userName: USER_NAME,
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
  const messages = await getMessagesFromDb(ctx.message.chat.id, 18, true);
  if (!messages || messages.length === 0) return [];

  const history = [];
  let lastRole = null;
  let currentTexts = [];

  const getRole = (userName) => userName === BOT_NAME ? "model" : "user";

  const pushHistoryTurn = (role, texts) => {
    if (texts.length > 0) {
      history.push({
        role,
        parts: [{ text: texts.join('\n') }]
      });
    }
  };

  for (const message of messages) {
    const decryptedMessage = {
      userName: message.userName,
      message: decryptText(message.message),
    };

    const role = getRole(decryptedMessage.userName);
    const textWithUser = role === "user"
      ? `${decryptedMessage.userName}: ${decryptedMessage.message}`
      : decryptedMessage.message;

    if (role === lastRole) {
      currentTexts.push(textWithUser);
    } else {
      if (lastRole !== null) {
        pushHistoryTurn(lastRole, currentTexts);
      }
      lastRole = role;
      currentTexts = [textWithUser];
    }
  }

  // Push the last group if any
  pushHistoryTurn(lastRole, currentTexts);

  // If there is only user role and no model, add an empty model turn
  const hasUser = history.some(h => h.role === "user");
  const hasModel = history.some(h => h.role === "model");
  if (hasUser && !hasModel) {
    history.push({
      role: "model",
      parts: [{ text: "" }]
    });
  }

  log(history, `Built AI history for chatId ${ctx.message.chat.id}:`);

  return history;
};