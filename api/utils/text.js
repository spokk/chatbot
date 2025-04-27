const clearText = (text, botUsername = process.env.BOT_USERNAME) => {
  if (!text) return "";

  return text
    .replace(`/ai@${botUsername}`, '')
    .replace(`/sum@${botUsername}`, '')
    .replace(`/img@${botUsername}`, '')
    .replace(`/gen@${botUsername}`, '')
    .replace(`/edit@${botUsername}`, '')
    .replace(`/ai`, '')
    .replace(`/sum`, '')
    .replace(`/img`, '')
    .replace(`/gen`, '')
    .replace(`/edit`, '')
    .trim();
};

module.exports = { clearText };