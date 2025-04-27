const { getMessagesFromDb } = require('../services/dbService');
const { generateAISummary } = require('../services/aiService');
const { decryptText } = require('../utils/crypto');

const handleAISummary = async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    const messages = await getMessagesFromDb(ctx.message.chat.id, 50);

    const decryptedMessages = messages.map((message) => ({
      userName: message.userName,
      message: decryptText(message.message),
    }));

    if (!decryptedMessages || decryptedMessages.length === 0) {
      await ctx.reply('⚠️ No messages found to summarize.');
      return;
    }

    const summary = await generateAISummary(JSON.stringify(decryptedMessages, null, 2));
    if (!summary) {
      await ctx.reply('⚠️ AI returned no summary.', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    await ctx.reply(summary, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Summary request error:', err);
    await ctx.reply('⚠️ Error while processing summary request. Try again...');
  }
};

module.exports = { handleAISummary };