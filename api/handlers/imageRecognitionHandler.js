const { generateAIImageResponse } = require('../services/aiService');

const { getImageToProcess, getLargestPhotoUrl } = require('../utils/image');
const { log } = require('../utils/logger');


const handleAIImageRecognition = async (ctx) => {
  log(ctx.message?.text || ctx.message?.caption, 'Received image recognition request:');

  const imgObject = getImageToProcess(ctx);

  if (!imgObject) {
    console.error('No image to process.');
    await ctx.reply('⚠️ No image or prompt found. Please send an image with a caption or reply to an image with a prompt.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const aiResponse = await generateAIImageResponse(fileUrl, imgObject.prompt);

    await ctx.reply(`${aiResponse}`, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Error processing image request:', err);
    await ctx.reply('⚠️ Error while processing the image request.');
  }
};

module.exports = { handleAIImageRecognition };