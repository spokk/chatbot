import 'dotenv/config.js';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

async function setCommands() {
  await bot.telegram.setMyCommands([
    { command: 'ai', description: 'Ask anything (text or image)' },
    { command: 'sum', description: 'Summarize the latest messages' },
    { command: 'gen', description: 'Generate or modify an image' },
    { command: 'voice', description: 'Convert text to speech' },
  ]);

  console.log('✅ Bot commands set successfully');
  process.exit(0);
}

setCommands().catch((err) => {
  console.error('❌ Failed to set commands:', err);
  process.exit(1);
});