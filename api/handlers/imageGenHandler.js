import { generateAIImage } from '../services/aiService.js';

import { processAIImageResponse } from '../utils/image.js';
import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

export const handleAIImageGen = async (ctx) => {
  const prompt = getMessage(ctx)

  log(prompt, 'Received image generation request:');

  if (!prompt) {
    await ctx.reply('⚠️ No input provided. Please send a prompt for image generation.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('upload_photo');

    const response = await generateAIImage(prompt)

    await processAIImageResponse(ctx, response);
  } catch (error) {
    console.error('Error processing image request:', error);
    const errorMessage = err?.error?.message || '⚠️ Error while processing the image generation request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
}