require('dotenv').config();
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { connectToDb } = require('./services/dbService');
const { generateAIResponse } = require('./services/aiService');
const { handleAIMessage } = require('./handlers/aiHandler');
const { logRequest } = require('./utils/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  logRequest(req);

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  bot.on(message('text'), async (ctx) => {
    await handleAIMessage(ctx, generateAIResponse);
  });

  // Connect to MongoDB
  const dbClient = await connectToDb();
  const db = dbClient.db('tg_db');
  const collection = db.collection('messages');

  try {
    const update = req.body;

    // Process the message and insert it into the DB
    await collection.insertOne(update);

    await bot.handleUpdate(update);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Update handling failed:', err);
    res.status(500).send('Error processing update');
  }
};