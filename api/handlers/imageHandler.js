


const { generateAIImageResponse } = require('../services/aiService');
const { clearText } = require('../utils/text');

const getShouldProcessImage = (ctx) => {
  const caption = ctx.message?.caption?.trim()
  const photo = ctx.message?.photo;

  if (photo && caption) {
    return caption.includes(`@${ctx.me}`) || caption.startsWith('/ai') || caption.startsWith(`/ai@${ctx.me}`);
  }

  return false
};

const getLargestPhotoUrl = async (ctx) => {
  const photos = ctx.message.photo;
  const largestPhoto = photos[photos.length - 1];
  const photoId = largestPhoto.file_id;

  const file = await ctx.telegram.getFile(photoId);
  return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
};

const handleAIImageMessage = async (ctx) => {
  if (!getShouldProcessImage(ctx)) {
    return;
  }

  try {
    console.log('Processing image request...');

    const fileUrl = await getLargestPhotoUrl(ctx);
    const clearedCaption = clearText(ctx.message.caption.trim(), ctx.me) || 'No caption provided';

    await ctx.sendChatAction('typing');

    const aiResponse = await generateAIImageResponse(fileUrl, clearedCaption);
    await ctx.reply(`${aiResponse}`, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Error processing image request:', err);
    await ctx.reply('⚠️ Error while processing the image request.');
  }
};

module.exports = { handleAIImageMessage };