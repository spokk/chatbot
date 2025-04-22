const clearText = (text, botUsername = process.env.BOT_USERNAME) => {
  if (!text) return "";

  return text
    .replace(`/ai@${botUsername}`, '')
    .replace(`/sum@${botUsername}`, '')
    .replace(`/ai`, '')
    .replace(`/sum`, '')
    .trim();
};

module.exports = { clearText };