import { generateAIImageEditResponse } from '../services/aiService.js';

import { getImagesToProcess, getLargestPhotoUrl, processAIImageResponse } from '../utils/image.js';
import { getMessage } from '../utils/text.js';

export const handleAIImageEdit = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  if (!prompt || !images) {
    await ctx.reply('⚠️ No input provided. Please send an image with a caption.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('upload_photo');

    const fileUrl = await getLargestPhotoUrl(ctx, images);
    const response = await generateAIImageEditResponse(fileUrl, prompt);

    await processAIImageResponse(ctx, response);
  } catch (err) {
    console.error('Error processing image request:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while processing the image generation request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
}