const clearText = (text, botUsername = process.env.BOT_USERNAME) => {
  if (!text) return "";

  return text
    .replace(`/ai@${botUsername}`, '')
    .replace(`/sum@${botUsername}`, '')
    .replace(`/img@${botUsername}`, '')
    .replace(`/ai`, '')
    .replace(`/sum`, '')
    .replace(`/img`, '')
    .trim();
};

module.exports = { clearText };