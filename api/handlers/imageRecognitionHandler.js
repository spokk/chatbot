import { generateAIImageResponse } from '../services/aiService.js';

import { getImageToProcess, getLargestPhotoUrl } from '../utils/image.js';
import { log } from '../utils/logger.js';


export const handleAIImageRecognition = async (ctx) => {
  log(ctx.message?.text || ctx.message?.caption, 'Received image recognition request:');

  const imgObject = getImageToProcess(ctx);

  if (!imgObject) {
    console.error('No image to process.');
    await ctx.reply('⚠️ No image or prompt found. Please send an image with a caption or reply to an image with a prompt.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const response = await generateAIImageResponse(fileUrl, imgObject.prompt);

    if (!response) {
      await ctx.reply('⚠️ AI returned nothing. Try again...', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    await ctx.reply(`${response}`, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Error processing image request:', err);
    await ctx.reply('⚠️ Error while processing the image request.', { reply_to_message_id: ctx.message.message_id });
  }
};