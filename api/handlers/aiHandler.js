const { generateAIResponse } = require('../services/aiService');
const { insertAIResponseToDb, buildAIHistory } = require('../services/dbService');

const { clearText } = require('../utils/text');

const handleAIMessage = async (ctx) => {
  const prompt = clearText(ctx.message?.text, ctx.me);

  if (!prompt) return;

  try {
    await ctx.sendChatAction('typing');
    const history = await buildAIHistory(ctx);
    const response = await generateAIResponse(prompt, history);

    if (!response) {
      await ctx.reply('⚠️ No response from AI. Try again...');
      return;
    }

    await Promise.all([
      sendResponseInChunks(ctx, response),
      insertAIResponseToDb(ctx, response)
    ]);
  } catch (err) {
    console.error('AI request error:', err);
    await ctx.reply('⚠️ Error while communicating with AI. Try again...');
  }
};

// Helper function to send the response in chunks
const sendResponseInChunks = async (ctx, response) => {
  const chunkSize = 4000;

  for (let i = 0; i < response.length; i += chunkSize) {
    const chunk = response.slice(i, i + chunkSize);

    try {
      if (i === 0) {
        await ctx.reply(chunk, { reply_to_message_id: ctx.message.message_id });
      } else {
        await ctx.reply(chunk);
      }
    } catch (err) {
      console.error(`Failed to send chunk: ${chunk}`, err);
      // Continue to the next chunk even if one fails
    }
  }
};


module.exports = { handleAIMessage };