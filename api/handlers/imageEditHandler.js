const { generateAIImageEditResponse } = require('../services/aiService');

const { getImageToProcess, getLargestPhotoUrl, processAIImageResponse } = require('../utils/image');
const { log } = require('../utils/logger');

const handleAIImageEdit = async (ctx) => {
  log(ctx.message?.text || ctx.message?.caption, 'Received image edit request:');

  const imgObject = getImageToProcess(ctx);

  if (!imgObject) {
    console.error('No image to process.');
    await ctx.reply('⚠️ No image to process. Please send an image with a caption.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const response = await generateAIImageEditResponse(fileUrl, imgObject.prompt);

    await processAIImageResponse(ctx, response);
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request. Try again...');
  }
}

module.exports = { handleAIImageEdit };