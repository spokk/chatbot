import { getAIResponse, getAIImageRecognitionResponse } from '../services/aiService.js';
import { insertAIResponseToDb, buildAIHistory } from '../services/dbService.js';

import { getMessage } from '../utils/text.js';
import { getImagesToProcess, getLargestPhotoUrl } from '../utils/image.js';

// Helper function to send the response in chunks
const sendResponseInChunks = async (ctx, response) => {
  const chunkSize = 4000;

  for (let i = 0; i < response.length; i += chunkSize) {
    const chunk = response.slice(i, i + chunkSize);

    try {
      if (i === 0) {
        await ctx.reply(chunk, { reply_to_message_id: ctx.message.message_id });
      } else {
        await ctx.reply(chunk);
      }
    } catch (err) {
      console.error(`Failed to send chunk: ${chunk}`, err);
      // Continue to the next chunk even if one fails
    }
  }
};

export const handleAIMessage = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  if (!prompt && !images) {
    await ctx.reply('⚠️ No input provided. Please send a message or an image for AI processing.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    let response

    await ctx.sendChatAction('typing');

    if (images) {
      const fileUrl = await getLargestPhotoUrl(ctx, images);
      response = await getAIImageRecognitionResponse(prompt, fileUrl);
    } else {
      const history = await buildAIHistory(ctx);
      response = await getAIResponse(prompt, history);
    }

    if (!response) {
      await ctx.reply('⚠️ No response from AI. Try again...', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    await Promise.all([
      sendResponseInChunks(ctx, response),
      insertAIResponseToDb(ctx, response)
    ]);
  } catch (err) {
    console.error('AI request error:', err);
    const errorMessage = err?.error?.message || '⚠️ Error while communicating with AI. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
};

