const clearText = (text, botUsername) => {
  return text
    .replace(`/ai@${botUsername}`, '')
    .replace(`/sum@${botUsername}`, '')
    .replace(`/ai`, '')
    .replace(`/sum`, '')
    .trim();
};

module.exports = { clearText };