import { generateAIImage } from '../services/aiService.js';
import { getImagesToProcess, getLargestPhotoUrl, prepareAIImageContent } from '../utils/image.js';
import { getMessage, sendImageFromResponse } from '../utils/text.js';
import { delay } from '../utils/request.js';
import { log } from '../utils/logger.js';

export const handleAIImage = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  log(prompt, 'Prompt to AI image handler:');

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
      console.error(`Error during image generation attempt ${attempt}:`, err);
      lastResponse = err;
      if (attempt < MAX_ATTEMPTS) await delay(RETRY_DELAY_MS);
    }
  }

  if (!imageSent) {
    console.warn('AI generated or edited no image: ', lastResponse);
    await ctx.reply(
      '⚠️ AI could not generate or edit an image. Please try again later.',
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
};