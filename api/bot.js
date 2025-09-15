import 'dotenv/config.js';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { connectToDb, insertMessageToDb } from './services/dbService.js';
import { handleAIMessage } from './handlers/aiHandler.js';
import { handleAISummary } from './handlers/summaryHandler.js';
import { handleAIImage } from './handlers/aiImageHandler.js';
import { imageHandlerRouter } from './handlers/imageHandlerRouter.js';
import { handleAITextToSpeech } from './handlers/ttsHandler.js';
import { isPrivateAiMessage } from './utils/text.js';
import { logger } from './utils/logger.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('ai', handleAIMessage);
bot.command('sum', handleAISummary);
bot.command('gen', handleAIImage);
bot.command('voice', handleAITextToSpeech);

// Photo handler
bot.on(message('photo'), imageHandlerRouter);

// Handle direct messages as /ai command
bot.on('message', async (ctx) => {
  if (isPrivateAiMessage(ctx)) await handleAIMessage(ctx);
});

export default async (req, res) => {
  logger.info(req.body, 'Received request body:');

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    await connectToDb();
    await Promise.all([bot.handleUpdate(req.body), insertMessageToDb(req.body)]);
    res.status(200).send('OK');
  } catch (err) {
    logger.error({ err }, 'Bot handling failed:');
    res.status(500).send('Error processing bot handling.');
  }
};