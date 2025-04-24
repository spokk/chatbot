const { generateAIImageEditResponse } = require('../services/aiService');
const { getImageToProcess, getLargestPhotoUrl } = require('../utils/image');

const { log } = require('../utils/logger');

const handleAIImageEdit = async (ctx) => {
  log(ctx.message.text, 'Received image edit request:');

  const imgObject = getImageToProcess(ctx);

  if (!imgObject) {
    console.error('No image to process.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const response = await generateAIImageEditResponse(fileUrl, imgObject.prompt);

    if (!response.candidates[0]?.content?.parts[0]?.inlineData) {
      console.error('AI generated no image:', { content: response.candidates[0]?.content });
      await ctx.reply(`⚠️ ${response.candidates[0]?.content?.parts[0]?.text}` || '⚠️ AI generated nothing.');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const caption = { caption: `Here is your generated image, ${ctx.message.from?.first_name || ctx.message.from?.username}!` }

        await ctx.replyWithPhoto({ source: buffer }, { ...caption });
      }
    }
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request.');
  }
}

module.exports = { handleAIImageEdit };