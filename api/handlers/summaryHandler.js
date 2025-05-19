import { getMessagesFromDb } from '../services/dbService.js';
import { generateAISummary } from '../services/aiService.js';
import { decryptText } from '../utils/crypto.js';

export const handleAISummary = async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    const messages = await getMessagesFromDb(ctx.message.chat.id, 50);

    const decryptedMessages = messages.map((message) => ({
      userName: message.userName,
      message: decryptText(message.message),
    }));

    if (!decryptedMessages || decryptedMessages.length === 0) {
      await ctx.reply('⚠️ No recent messages found to summarize. Please send some messages first.', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    const summary = await generateAISummary(JSON.stringify(decryptedMessages));
    if (!summary) {
      await ctx.reply('⚠️ AI returned no summary.', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    await ctx.reply(summary, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Summary request error:', err);
    await ctx.reply('⚠️ Error while processing summary request. Try again...', { reply_to_message_id: ctx.message.message_id });
  }
};