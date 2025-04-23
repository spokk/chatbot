const { generateAIResponse } = require('../services/aiService');
const { clearText } = require('../utils/text');

const handleAIMessage = async (ctx) => {
  const prompt = clearText(ctx.message?.text, ctx.me);

  if (!prompt) return;

  try {
    await ctx.sendChatAction('typing');
    const aiContext = buildAIContext(ctx, prompt);
    const response = await generateAIResponse(aiContext);
    console.log('AI response:', response);

    await sendResponseInChunks(ctx, response, ctx.message.message_id);
  } catch (err) {
    console.error('AI request error:', err);
    await ctx.reply('⚠️ Error while communicating with AI');
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

// Helper function to build AI context
const buildAIContext = (ctx, prompt) => {
  const isReply = ctx.message?.reply_to_message;
  const repliedMessage = clearText(ctx.message?.reply_to_message?.text, ctx.me);

  if (isReply && repliedMessage) {
    return `Context: "${repliedMessage}". Request: "${prompt}".`;
  }

  return prompt;
};

module.exports = { handleAIMessage };