import { getMessagesFromDb } from '../services/dbService.js';
import { generateAIContent } from '../services/aiService.js';
import { decryptText } from '../utils/crypto.js';

export const handleAISummary = async (ctx) => {
  console.log('Summary command invoked.');

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

    const systemInstruction = `This is the list of messages. Make a short summary of the key points of the conversation.`;

    const summary = await generateAIContent(JSON.stringify(decryptedMessages), systemInstruction);

    if (!summary) {
      console.warn('AI returned no summary.');

      await ctx.reply('⚠️ AI returned no summary.', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    await ctx.reply(summary, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Summary request error:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while processing summary request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
};