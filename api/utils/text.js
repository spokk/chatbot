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

  const candidates = [
    ctx?.message?.text,
    ctx?.message?.caption,
    ctx?.message?.quote?.text,
    ctx?.message?.reply_to_message?.text,
    ctx?.message?.reply_to_message?.caption,
  ];

  for (const candidate of candidates) {
    const cleaned = clearText(candidate, resolvedBotUsername);
    if (cleaned) return cleaned;
  }

  return '';
};

// Helper to check if message should be handled as /ai in private chat
export const isPrivateAiMessage = (ctx) => ctx.chat?.type === 'private' && clearText(ctx.message?.text, ctx?.me)