const clearText = (text, botUsername) => {
  return text
    .replace(`/ai`, '')
    .replace(`/ai@${botUsername}`, '')
    .replace(`/sum`, '')
    .replace(`/sum@${botUsername}`, '')
    .trim();
};

module.exports = { clearText };