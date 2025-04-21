const { clearText } = require('../utils/text');

// Helper function to send the response in chunks
const sendResponseInChunks = async (ctx, response, messageId) => {
  const chunkSize = 4000;
  for (let i = 0; i < response.length; i += chunkSize) {
    const chunk = response.slice(i, i + chunkSize);
    if (i === 0) {
      await ctx.reply(chunk, { reply_to_message_id: messageId });
    } else {
      await ctx.reply(chunk);
    }
  }
};

// Helper function to check if the message should be processed
const getShouldProcessMessage = (text, botUsername) => {
  return text.includes(`@${botUsername}`) || text.startsWith('/ai') || text.startsWith(`/ai@${botUsername}`);
};

// Helper function to check if a summary should be generated
const getShouldGenerateSummary = (text, botUsername) => {
  return text.startsWith('/sum') || text.startsWith(`/sum@${botUsername}`);
};

// Helper function to handle summary requests
const handleSummaryRequest = async (ctx, chatId, messageId, getMessagesFromDb, generateAISummary) => {
  try {
    await ctx.sendChatAction('typing');
    const chatMessages = await getMessagesFromDb(chatId, 50);

    if (chatMessages.length === 0) {
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
    console.error('AI summary error:', err);
    await ctx.reply('⚠️ Error while communicating with AI for summary');
  }
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

const handleAIMessage = async (ctx, generateAIResponse, generateAISummary, getMessagesFromDb) => {
  const text = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  const shouldGenerateSummary = getShouldGenerateSummary(text, ctx.me)
  const shouldProcessMessage = getShouldProcessMessage(text, ctx.me);

  if (shouldGenerateSummary) {
    await handleSummaryRequest(ctx, chatId, messageId, getMessagesFromDb, generateAISummary);
    return;
  }

  if (!shouldProcessMessage) return;

  try {
    const prompt = clearText(text, ctx.me);
    if (!prompt) return;

    await ctx.sendChatAction('typing');

    const aiContext = buildAIContext(ctx, prompt);
    const response = await generateAIResponse(aiContext);

    await sendResponseInChunks(ctx, response, messageId);
  } catch (err) {
    console.error('AI error:', err);
    await ctx.reply('⚠️ Error while communicating with AI');
  }
};

module.exports = { handleAIMessage };