import { generateAIImage } from '../services/aiService.js';

import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 500;

export const handleAIImageGen = async (ctx) => {
  const prompt = getMessage(ctx)

  log(prompt, 'Received image generation request:');

  if (!prompt) {
    await ctx.reply('⚠️ No input provided. Please send a prompt for image generation.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('upload_photo');

    let imageSent = false;
    let lastResponse = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !imageSent; attempt++) {
      console.log(`Attempt ${attempt} to generate image...`);
      lastResponse = await generateAIImage(prompt);

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
      log(lastResponse, 'AI generated no image: ');
      const fallbackMessage = 'AI generated no image. Try again...';
      await ctx.reply(`⚠️ ${fallbackMessage}`, { reply_to_message_id: ctx.message.message_id });
    }

  } catch (err) {
    console.error('Error processing image request:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while processing the image generation request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
}