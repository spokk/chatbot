import { generateAIImageEditResponse } from '../services/aiService.js';

import { getImageToProcess, getLargestPhotoUrl, processAIImageResponse } from '../utils/image.js';
import { log } from '../utils/logger.js';

export const handleAIImageEdit = async (ctx) => {
  log(ctx.message?.text || ctx.message?.caption, 'Received image edit request:');

  const imgObject = getImageToProcess(ctx);

  if (!imgObject) {
    console.error('No image to process.');
    await ctx.reply('⚠️ No image to process. Please send an image with a caption.', ...(ctx.message?.message_id && { reply_to_message_id: ctx.message.message_id }));
    return;
  }

  try {
    await ctx.sendChatAction('upload_photo');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const response = await generateAIImageEditResponse(fileUrl, imgObject.prompt);

    await processAIImageResponse(ctx, response);
  } catch (error) {
    console.error('Error processing image request:', error);
    await ctx.reply('⚠️ Error while processing the image generation request. Try again...', ...(ctx.message?.message_id && { reply_to_message_id: ctx.message.message_id }));
  }
}