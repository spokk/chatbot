import removeMarkdown from 'remove-markdown';

import { generateAIResponse } from '../services/aiService.js';

import { insertAIResponseToDb, buildAIHistory } from '../services/dbService.js';

import { getMessage } from '../utils/text.js';

// Helper function to send the response in chunks
const sendResponseInChunks = async (ctx, response) => {
  const chunkSize = 4000;
  // Remove markdown/formatting from the response
  const plainResponse = removeMarkdown(response);

  for (let i = 0; i < plainResponse.length; i += chunkSize) {
    const chunk = plainResponse.slice(i, i + chunkSize);

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

  if (!prompt) {
    await ctx.reply('⚠️ No input provided. Please send a message for AI processing.', { reply_to_message_id: ctx.message.message_id });
    return;
  }

  try {
    await ctx.sendChatAction('typing');
    const history = await buildAIHistory(ctx);
    const response = await generateAIResponse(prompt, history);

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
    await ctx.reply('⚠️ Error while communicating with AI. Try again...', { reply_to_message_id: ctx.message.message_id });
  }
};

