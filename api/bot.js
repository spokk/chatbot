import 'dotenv/config.js';
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import { connectToDb, insertMessageToDb } from './services/dbService.js';
import { handleAIMessage } from './handlers/aiHandler.js';
import { handleAIImageRecognition } from './handlers/imageRecognitionHandler.js';
import { handleAISummary } from './handlers/summaryHandler.js';
import { handleAIImageGen } from './handlers/imageGenHandler.js';
import { handleAIImageEdit } from './handlers/imageEditHandler.js';
import { imageHandlerRouter } from './handlers/imageHandlerRouter.js';
import { log } from './utils/logger.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('ai', async (ctx) => { await handleAIMessage(ctx) });
bot.command('sum', async (ctx) => { await handleAISummary(ctx) });
bot.command('img', async (ctx) => { await handleAIImageRecognition(ctx) });
bot.command('gen', async (ctx) => { await handleAIImageGen(ctx) });
bot.command('edit', async (ctx) => { await handleAIImageEdit(ctx) });
bot.on(message('photo'), async (ctx) => { await imageHandlerRouter(ctx) });

export default async (req, res) => {
  log(req.body, 'Received request body:');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    await connectToDb();
    await Promise.all([bot.handleUpdate(req.body), insertMessageToDb(req.body)]);

    res.status(200).send('OK');
  } catch (err) {
    console.error('Bot handling failed:', err);

    res.status(500).send('Error processing bot handling.');
  }
};