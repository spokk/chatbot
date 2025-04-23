require('dotenv').config();

const { Telegraf } = require('telegraf');

const { connectToDb } = require('./services/dbService');
const { handleAIMessage } = require('./handlers/aiHandler');
const { handleAIImageMessage } = require('./handlers/imageHandler');
const { handleAISummary } = require('./handlers/summaryHandler');
const { insertMessageToDb } = require('./handlers/dbHandler');
const { log } = require('./utils/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  log(req.body, 'Received request body:');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  bot.command('img', async (ctx) => { await handleAIImageMessage(ctx) })

  bot.command('ai', async (ctx) => { await handleAIMessage(ctx) })

  bot.command('sum', async (ctx) => { await handleAISummary(ctx) })

  // Connect to MongoDB
  const dbClient = await connectToDb();
  const db = dbClient.db('tg_db');
  const collection = db.collection('messages');

  try {
    await insertMessageToDb(req.body, collection);

    await bot.handleUpdate(req.body);

    res.status(200).send('OK');
  } catch (err) {
    console.error('Update handling failed:', err);
    res.status(500).send('Error processing update');
  }
};