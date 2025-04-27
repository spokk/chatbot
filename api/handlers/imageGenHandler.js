const { generateAIImage } = require('../services/aiService');

const { processAIImageResponse } = require('../utils/image');
const { clearText } = require('../utils/text');
const { log } = require('../utils/logger');

const handleAIImageGen = async (ctx) => {
  log(ctx.message?.text, 'Received image generation request:');

  if (!ctx.message?.text) {
    await ctx.reply('⚠️ No input provided. Please send a prompt for image generation.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const contents = clearText(ctx.message?.text, ctx.me) || "No request provided."

    const response = await generateAIImage(contents)

    await processAIImageResponse(ctx, response);
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request. Try again...');
  }
}

module.exports = { handleAIImageGen };