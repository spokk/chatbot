import { requestAIChat, generateAIContent } from '../services/aiService.js';
import { insertAIResponseToDb, buildAIHistory } from '../services/dbService.js';

import { getImagesToProcess, getLargestPhotoUrl, prepareAIImageContent } from '../utils/image.js';
import { getMessage, getErrorMessage, sendResponseInChunks } from '../utils/text.js';

import { logger } from '../utils/logger.js';

export const handleAIMessage = async (ctx) => {
  const prompt = getMessage(ctx);
  const images = getImagesToProcess(ctx);

  logger.info({ prompt }, 'Prompt to AI message handler:');

  if (!prompt && !images) {
    await ctx.reply(
      '⚠️ No input provided. Please send a message or an image for AI processing.',
      { reply_to_message_id: ctx.message?.message_id }
    );
    return;
  }

  await ctx.sendChatAction('typing');

  try {
    let response;
    if (images) {
      const imageURL = await getLargestPhotoUrl(ctx, images);
      const contents = await prepareAIImageContent(prompt, imageURL);
      response = await generateAIContent(contents);
    } else {
      const history = await buildAIHistory(ctx);
      response = await requestAIChat(prompt, history);
    }

    if (!response) {
      await ctx.reply(
        '⚠️ No response from AI. Try again...',
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }

    logger.info({ response }, 'Response from AI message handler:');
    await Promise.all([
      sendResponseInChunks(ctx, response),
      insertAIResponseToDb(ctx, response)
    ]);
  } catch (err) {
    logger.error({ err }, 'AI request error:');
    const errorMessage = getErrorMessage(err, '⚠️ Error while communicating with AI. Try again...');
    await Promise.all([
      ctx.reply(errorMessage, { reply_to_message_id: ctx.message?.message_id }),
      insertAIResponseToDb(ctx, errorMessage)
    ]);
  }
};

