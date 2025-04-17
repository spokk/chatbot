const formatText = (text) => text
  .replace(/_/g, '\\_') // Escape underscores
  .replace(/\*/g, '\\*') // Escape asterisks
  .replace(/\[/g, '\\[') // Escape square brackets
  .replace(/`/g, '\\`'); // Escape backticks

module.exports = { formatText };