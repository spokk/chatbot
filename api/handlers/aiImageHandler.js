import { generateAIImage } from '../services/aiService.js';
import { getImagesToProcess, getLargestPhotoUrl, prepareAIImageContent } from '../utils/image.js';
import { getMessage, getErrorMessage, sendImageFromResponse } from '../utils/text.js';
import { delay } from '../utils/request.js';

import { logger } from '../utils/logger.js';

export const handleAIImage = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  logger.info({ prompt }, 'Prompt to AI image handler:');

  if (!prompt) {
    await ctx.reply('⚠️ No input provided.', { reply_to_message_id: ctx.message?.message_id });
    return;
  }

  await ctx.sendChatAction('upload_photo');

  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 500;
  let imageSent = false;
  let lastResponse = null;

  const imageURL = images && images.length > 0
    ? await getLargestPhotoUrl(ctx, images)
    : null;

  const tryGenerateAndSend = async () => {
    if (imageURL) {
      const contents = await prepareAIImageContent(prompt, imageURL);
      return generateAIImage(contents);
    }
    return generateAIImage(prompt);
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !imageSent; attempt++) {
    try {
      lastResponse = await tryGenerateAndSend();
      imageSent = await sendImageFromResponse(ctx, lastResponse);
      if (!imageSent && attempt < MAX_ATTEMPTS) await delay(RETRY_DELAY_MS);
    } catch (err) {
      logger.error({ err }, `Error during image generation attempt ${attempt}:`);
      lastResponse = err;
      if (attempt < MAX_ATTEMPTS) await delay(RETRY_DELAY_MS);
    }
  }

  if (!imageSent) {
    logger.warn({ lastResponse }, 'AI generated or edited no image: ');

    const errorMessage = getErrorMessage(lastResponse, '⚠️ AI could not generate or edit an image. Please try again later.')

    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message?.message_id });
  }
};