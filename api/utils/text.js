export const clearText = (text, botUsername = process.env.BOT_USERNAME) => {
  if (typeof text !== 'string') return '';

  // Define the commands to remove
  const commands = ['/ai', '/sum', '/img', '/gen', '/edit', '/voice'];

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

export const getMessage = (ctx) => {
  const botUsername = ctx?.me || process.env.BOT_USERNAME

  const message = clearText(ctx.message?.text, botUsername)
  const replyMessage = clearText(ctx.message?.reply_to_message?.text, botUsername)
  const caption = clearText(ctx.message?.reply_to_message?.caption, botUsername)

  if (message) {
    return message;
  } else if (replyMessage) {
    return replyMessage;
  } else if (caption) {
    return caption;
  }

  return '';
};