const handleAIMessage = async (ctx, generateAIResponse) => {
  const text = ctx.message.text;
  const mentionedBot = text.includes(`@${ctx.me}`);
  const startsWithAi = text.startsWith('/ai ');

  if (!mentionedBot && !startsWithAi) return;

  let prompt = mentionedBot
    ? text.replace(`@${ctx.me}`, '').trim()
    : text.replace('/ai', '').trim();

  if (!prompt) return;

  try {
    await ctx.sendChatAction('typing');
    const response = await generateAIResponse(prompt);
    await ctx.reply(response, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('AI error:', err);
    await ctx.reply('⚠️ Error while communicating with AI');
  }
};

module.exports = { handleAIMessage };