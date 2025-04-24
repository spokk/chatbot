require('dotenv').config();

const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

const { connectToDb } = require('./services/dbService');
const { handleAIMessage } = require('./handlers/aiHandler');
const { handleAIImageRecognition } = require('./handlers/imageRecognitionHandler');
const { handleAISummary } = require('./handlers/summaryHandler');
const { insertMessageToDb } = require('./handlers/dbHandler');
const { handleAIImageGen } = require('./handlers/imageGenHandler');
const { handleAIImageEdit } = require('./handlers/imageEditHandler');
const { imageHandlerRouter } = require('./handlers/imageHandlerRouter');

const { log } = require('./utils/logger');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  log(req.body, 'Received request body:');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  bot.command('img', async (ctx) => { await handleAIImageRecognition(ctx) })

  bot.command('ai', async (ctx) => { await handleAIMessage(ctx) })

  bot.command('sum', async (ctx) => { await handleAISummary(ctx) })

  bot.command('gen', async (ctx) => { await handleAIImageGen(ctx) })

  bot.command('edit', async (ctx) => { await handleAIImageEdit(ctx) })

  bot.on(message('photo'), async (ctx) => { await imageHandlerRouter(ctx) });


  // Connect to MongoDB
  const dbClient = await connectToDb();
  const db = dbClient.db('tg_db');
  const collection = db.collection('messages');

  try {
    await Promise.all([bot.handleUpdate(req.body), insertMessageToDb(req.body, collection)]);

    res.status(200).send('OK');
  } catch (err) {
    console.error('Update handling failed:', err);
    res.status(500).send('Error processing update');
  }
};