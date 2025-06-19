import { generateAIImageEditResponse } from '../services/aiService.js';

import { getImagesToProcess, getLargestPhotoUrl } from '../utils/image.js';
import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 500;

export const handleAIImageEdit = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  if (!prompt || !images) {
    await ctx.reply('⚠️ No input provided. Please send an image with a caption.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  log(prompt, 'AI image edit input:');

  try {
    await ctx.sendChatAction('upload_photo');

    const fileUrl = await getLargestPhotoUrl(ctx, images);

    let imageSent = false;
    let lastResponse = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !imageSent; attempt++) {
      console.log(`Attempt ${attempt} to edit image...`);
      lastResponse = await generateAIImageEditResponse(fileUrl, prompt);

      const parts = lastResponse?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((part) => part?.inlineData?.data);

      if (imagePart) {
        const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

        await ctx.replyWithPhoto(
          { source: buffer },
          { reply_to_message_id: ctx.message.message_id }
        );

        imageSent = true;
      } else if (attempt < MAX_ATTEMPTS) {
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      }
    }

    if (!imageSent) {
      log(lastResponse, 'AI edited no image: ');
      const fallbackMessage = 'AI edited no image. Try again...';
      await ctx.reply(`⚠️ ${fallbackMessage}`, { reply_to_message_id: ctx.message.message_id });
    }

  } catch (err) {
    console.error('Error processing image request:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while processing the image generation request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
}