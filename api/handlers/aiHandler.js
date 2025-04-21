const { getMessagesFromDb } = require('../services/dbService');
const { generateAIResponse, generateAISummary } = require('../services/aiService');
const { clearText } = require('../utils/text');

// Main function to handle AI messages
const handleAIMessage = async (ctx) => {
  const { text, chat, message_id: messageId } = ctx.message;
  const chatId = chat.id;

  if (shouldGenerateSummary(text, ctx.me)) {
    await processSummaryRequest(ctx, chatId, messageId);
    return;
  }

  if (!shouldProcessMessage(text, ctx)) return;

  const prompt = clearText(text, ctx.me);
  if (!prompt) return;

  await processAIRequest(ctx, prompt, messageId);
};

// Helper function to process summary requests
const processSummaryRequest = async (ctx, chatId, messageId) => {
  try {
    await ctx.sendChatAction('typing');
    const chatMessages = await getMessagesFromDb(chatId, 50);

    if (!chatMessages || chatMessages.length === 0) {
      await ctx.reply('⚠️ No messages found to summarize.');
      return;
    }

    const summary = await generateAISummary(JSON.stringify(chatMessages, null, 2));
    if (!summary) {
      await ctx.reply('⚠️ AI returned no summary.', { reply_to_message_id: messageId });
      return;
    }

    await ctx.reply(summary, { reply_to_message_id: messageId });
  } catch (err) {
    console.error('Summary request error:', err);
    await ctx.reply('⚠️ Error while processing summary request');
  }
};

// Helper function to process AI requests
const processAIRequest = async (ctx, prompt, messageId) => {
  try {
    await ctx.sendChatAction('typing');
    const aiContext = buildAIContext(ctx, prompt);
    const response = await generateAIResponse(aiContext);
    console.log('AI response:', response);

    await sendResponseInChunks(ctx, response, messageId);
  } catch (err) {
    console.error('AI request error:', err);
    await ctx.reply('⚠️ Error while communicating with AI');
  }
};

// Helper function to send the response in chunks
const sendResponseInChunks = async (ctx, response, messageId) => {
  const chunkSize = 4000;

  for (let i = 0; i < response.length; i += chunkSize) {
    const chunk = response.slice(i, i + chunkSize);

    try {
      await ctx.reply(chunk, i === 0 ? { reply_to_message_id: messageId } : {});
    } catch (err) {
      console.error(`Failed to send chunk: ${chunk}`, err);
      // Continue to the next chunk even if one fails
    }
  }
};

// Helper function to check if the message should be processed
const shouldProcessMessage = (text, ctx) => {
  return text.includes(`@${ctx.me}`) ||
    text.startsWith('/ai') ||
    text.startsWith(`/ai@${ctx.me}`) ||
    ctx.message?.reply_to_message?.text?.trim() === "/ai" ||
    ctx.message?.reply_to_message?.text?.trim() === `/ai@${ctx.me}`;

};

// Helper function to check if a summary should be generated
const shouldGenerateSummary = (text, botUsername) => {
  return text.startsWith('/sum') || text.startsWith(`/sum@${botUsername}`);
};

// Helper function to build AI context
const buildAIContext = (ctx, prompt) => {
  const isReply = ctx.message?.reply_to_message;
  const repliedMessage = ctx.message?.reply_to_message?.text;

  if (isReply && repliedMessage) {
    const cleanRepliedMessage = clearText(repliedMessage, ctx.me);
    return `Text to process: "${cleanRepliedMessage}". Request: "${prompt}"`;
  }

  return prompt;
};

module.exports = { handleAIMessage };