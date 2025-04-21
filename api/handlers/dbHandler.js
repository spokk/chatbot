const { clearText } = require('../utils/text');

const insertMessageToDb = async (body, collection) => {
  const messageData = extractMessageData(body);

  if (!messageData) return;

  const { chatId, text, userName } = messageData;

  // Insert the message into the database
  await collection.insertOne({
    chatId,
    message: text,
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
    text: clearText(message.text),
    userName,
  };
};

module.exports = { insertMessageToDb };