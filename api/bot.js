require('dotenv').config();
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { connectToDb, getMessagesFromDb } = require('./services/dbService');
const { generateAIResponse, generateAISummary } = require('./services/aiService');
const { handleAIMessage } = require('./handlers/aiHandler');
const { insertMessageToDb } = require('./handlers/dbHandler');
const { logRequest } = require('./utils/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  logRequest(req.body);

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  bot.on(message('text'), async (ctx) => {
    await handleAIMessage(ctx, generateAIResponse, generateAISummary, getMessagesFromDb);
  });

  // Connect to MongoDB
  const dbClient = await connectToDb();
  const db = dbClient.db('tg_db');
  const collection = db.collection('messages');

  try {
    const update = req.body;

    // Insert message into the database
    await insertMessageToDb(update, collection);

    await bot.handleUpdate(update);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Update handling failed:', err);
    res.status(500).send('Error processing update');
  }
};