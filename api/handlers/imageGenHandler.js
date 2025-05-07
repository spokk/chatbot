const { generateAIImage } = require('../services/aiService');

const { processAIImageResponse } = require('../utils/image');
const { clearText } = require('../utils/text');
const { log } = require('../utils/logger');

const handleAIImageGen = async (ctx) => {
  log(ctx.message?.text, 'Received image generation request:');

  const prompt = clearText(ctx.message?.text, ctx.me)

  if (!prompt) {
    await ctx.reply('⚠️ No input provided. Please send a prompt for image generation.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const response = await generateAIImage(prompt)

    await processAIImageResponse(ctx, response);
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request. Try again...', { reply_to_message_id: ctx.message.message_id });
  }
}

module.exports = { handleAIImageGen };