const { generateAIImage } = require('../services/aiService');

const { log } = require('../utils/logger');

const handleAIImageGen = async (ctx) => {
  log(ctx.message.text, 'Received image generation request:');

  await ctx.sendChatAction('typing');

  try {
    const response = await generateAIImage(ctx)

    if (!response.candidates[0]?.content?.parts[0]?.inlineData) {
      console.error('AI generated nothing:', { content: response.candidates[0]?.content });
      await ctx.reply(`⚠️ ${response.candidates[0]?.content?.parts[0]?.text}` || '⚠️ AI generated nothing.');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        await ctx.replyWithPhoto({ source: buffer }, { caption: 'Here is your generated image!' });
      }
    }
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request.');
  }
}

module.exports = { handleAIImageGen };