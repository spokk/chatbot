const handleAIMessage = async (ctx, generateAIResponse, generateAISummary, getMessagesFromDb) => {
  const text = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  const mentionedBot = text.includes(`@${ctx.me}`);
  const startsWithAi = text.startsWith('/ai ');

  const shouldGenerateSummary = text.startsWith('/sum') || text.startsWith(`/sum@${ctx.me}`)

  if (shouldGenerateSummary) {
    try {
      await ctx.sendChatAction('typing');

      const chatMessages = await getMessagesFromDb(chatId, 30);

      console.log('Chat messages:', chatMessages);

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
  }

  if (!mentionedBot && !startsWithAi) return;

  let prompt = mentionedBot
    ? text.replace(`@${ctx.me}`, '').trim()
    : text.replace('/ai', '').trim();

  if (!prompt) return;

  try {
    await ctx.sendChatAction('typing');
    const response = await generateAIResponse(prompt);

    if (response.length > 4000) {
      const chunkSize = 4000;
      for (let i = 0; i < response.length; i += chunkSize) {
        const chunk = response.slice(i, i + chunkSize); // Slice the response into chunks
        if (i === 0) {
          await ctx.reply(chunk, { reply_to_message_id: messageId });
        } else {
          await ctx.reply(chunk);
        }
      }
    } else {
      await ctx.reply(response, { reply_to_message_id: messageId });
    }

  } catch (err) {
    console.error('AI error:', err);
    await ctx.reply('⚠️ Error while communicating with AI');
  }
};

module.exports = { handleAIMessage };