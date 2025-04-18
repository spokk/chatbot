const insertMessageToDb = async (update, collection) => {
  const hasIdAndText =
    (update?.message?.chat.id || update?.edited_message?.chat.id) &&
    (update?.message?.text || update?.edited_message?.text);

  const isCommand =
    update?.message?.text?.startsWith('/sum') ||
    update?.edited_message?.text?.startsWith('/sum');

  if (!isCommand && hasIdAndText) {
    const userName =
      update?.message?.from.first_name ||
      update?.edited_message?.from.first_name ||
      update?.message?.from.username ||
      update?.edited_message?.from.username;

    await collection.insertOne({
      chatId: update?.message?.chat.id || update?.edited_message?.chat.id,
      message: update?.message?.text || update?.edited_message?.text,
      userName,
      createdAt: new Date(),
    });
  }
};

module.exports = { insertMessageToDb };