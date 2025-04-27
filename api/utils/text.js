const clearText = (text, botUsername = process.env.BOT_USERNAME) => {
  if (typeof text !== 'string') return '';

  const commands = ['/ai', '/sum', '/img', '/gen', '/edit'];
  const botSpecificCommands = commands.map((cmd) => `${cmd}@${botUsername}`);

  // Combine all commands into a single array
  const allCommands = [...commands, ...botSpecificCommands];

  // Remove all commands from the text
  let cleanedText = text;
  allCommands.forEach((cmd) => {
    cleanedText = cleanedText.replace(cmd, '');
  });

  return cleanedText.trim();
};

module.exports = { clearText };