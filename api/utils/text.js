import { logger } from './logger.js';

export const isCommand = (ctx, command) => {
  const text = ctx.message?.caption || ctx.message?.text || '';
  return text.startsWith(command) || text.startsWith(`${command}@${ctx.me}`);
};

export const getIsAiCommand = (ctx) => isCommand(ctx, '/ai');
export const getIsGenCommand = (ctx) => isCommand(ctx, '/gen');

export const clearText = (text, botUsername) => {
  if (typeof text !== 'string') return '';

  // Define the commands to remove
  const commands = ['/ai', '/sum', '/gen', '/voice'];

  // Create an array of commands with the bot username
  const botSpecificCommands = commands.map((cmd) => `${cmd}@${botUsername}`);

  // Combine all commands into a single array
  const allCommands = [...botSpecificCommands, ...commands];

  // Remove all commands from the text
  let cleanedText = text;
  allCommands.forEach((cmd) => {
    cleanedText = cleanedText.replace(cmd, '');
  });

  return cleanedText.trim();
}

export const getMessage = (ctx, botUsername) => {
  const resolvedBotUsername = ctx?.me || botUsername;

  // Clean all possible sources once
  const mainText = clearText(ctx?.message?.text, resolvedBotUsername);
  const quoteText = clearText(ctx?.message?.quote?.text, resolvedBotUsername);
  const replyText = clearText(ctx?.message?.reply_to_message?.text, resolvedBotUsername);
  const caption = clearText(ctx?.message?.caption, resolvedBotUsername);
  const replyCaption = clearText(ctx?.message?.reply_to_message?.caption, resolvedBotUsername);

  // Combine mainText with the first available quote/reply if both exist
  if (mainText) {
    const secondary = quoteText || replyText;
    if (secondary) {
      return `"${secondary}".\n${mainText}`;
    }
    return mainText;
  }

  // Otherwise, return the first available candidate
  return caption || quoteText || replyText || replyCaption || '';
};

// Helper to check if message should be handled as /ai in private chat
export const isPrivateAiMessage = (ctx) => ctx.chat?.type === 'private' && clearText(ctx.message?.text, ctx?.me)

export const sendResponseInChunks = async (ctx, response) => {
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
      logger.error({ err }, `Failed to send chunk: ${chunk}`);
      // Continue to the next chunk even if one fails
    }
  }
};

export const sendImageFromResponse = async (ctx, response) => {
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

export const getErrorMessage = (err, defaultMessage = '') => {
  let errorMessage = null;

  try {
    // Some errors come as JSON in err.message
    const parsed = JSON.parse(err.message);
    if (parsed?.error?.message) {
      errorMessage = parsed.error.message;
    }
  } catch {
    // if not JSON, just use err.message if it exists
    if (err?.message) {
      errorMessage = err.message;
    }
  }

  // Check Gemini-style candidate response
  if (!errorMessage && err?.lastResponse?.candidates?.length) {
    const firstText = err.lastResponse.candidates[0]?.content?.parts?.[0]?.text;
    if (firstText) {
      errorMessage = firstText;
    }
  }

  return (
    (errorMessage ? `⚠️ ${errorMessage}` : '') ||
    defaultMessage ||
    '⚠️ An unexpected error occurred. Please try again.'
  );
};