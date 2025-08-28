import { generateAIImage } from '../services/aiService.js';
import { getImagesToProcess, getLargestPhotoUrl, prepareAIImageContent } from '../utils/image.js';
import { getMessage } from '../utils/text.js';
import { log } from '../utils/logger.js';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 500;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const sendImageFromResponse = async (ctx, response) => {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part?.inlineData?.data);
  if (imagePart) {
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    await ctx.replyWithPhoto(
      { source: buffer },
      { reply_to_message_id: ctx.message.message_id }
    );
    return true;
  }
  return false;
};

export const handleAIImage = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  log(prompt, 'Prompt to AI image handler:');

  if (!prompt) {
    await ctx.reply('⚠️ No input provided.', { reply_to_message_id: ctx.message?.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('upload_photo');

    let imageURL = null;
    let imageSent = false;
    let lastResponse = null;

    if (images && images.length > 0) {
      imageURL = await getLargestPhotoUrl(ctx, images);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !imageSent; attempt++) {
      console.log(`Attempt ${attempt} to generate image...`);

      try {
        if (imageURL) {
          const contents = await prepareAIImageContent(prompt, imageURL);
          lastResponse = await generateAIImage(contents);
        } else {
          lastResponse = await generateAIImage(prompt);
        }

        imageSent = await sendImageFromResponse(ctx, lastResponse);

        if (!imageSent && attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
        }
      } catch (genErr) {
        console.error(`Error during image generation attempt ${attempt}:`, genErr);
        lastResponse = genErr;
        if (attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    if (!imageSent) {
      console.warn('AI generated or edited no image: ', lastResponse);
      const fallbackMessage = 'AI could not generate or edit an image. Please try again later.';
      await ctx.reply(`⚠️ ${fallbackMessage}`, { reply_to_message_id: ctx.message?.message_id });
    }

  } catch (err) {
    console.error('Error while processing the image request:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while processing the image request. Please try again later.';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message?.message_id });
  }
}