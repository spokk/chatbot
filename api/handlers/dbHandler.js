const { clearText } = require('../utils/text');

const { encryptText } = require('../utils/crypto');

const insertMessageToDb = async (body, collection) => {
  const messageData = extractMessageData(body);

  if (!messageData) return;

  const { chatId, text, userName } = messageData;

  const clearedText = clearText(text)

  if (!clearedText) return;

  // Encrypt the message text before inserting
  const encryptedText = encryptText(clearedText);

  await collection.insertOne({
    chatId,
    message: encryptedText,
    userName,
    createdAt: new Date(),
  });
};

// Helper function to extract message data
const extractMessageData = (body) => {
  const message = body?.message || body?.edited_message;

  if (!message || !message.chat?.id || !message.text) return null;

  const isCommand = message.text.startsWith('/sum');

  if (isCommand) return null;

  const userName = message.from?.first_name || message.from?.username;

  return {
    chatId: message.chat.id,
    text: message.text,
    userName,
  };
};

module.exports = { insertMessageToDb };