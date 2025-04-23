


const { generateAIImageResponse } = require('../services/aiService');
const { clearText } = require('../utils/text');

const getIsImgCommand = (ctx) => {
  const imgCmd = `/img`;
  const text = ctx.message?.caption || ctx.message?.text || '';

  return text.startsWith(imgCmd) || text.startsWith(`${imgCmd}@${ctx.me}`);
}

const getImageToProcess = (ctx) => {
  const prompt = clearText(ctx.message?.caption, ctx.me)
  const photos = ctx.message?.photo;

  if (photos && prompt) {
    return { photos, prompt };
  }

  const replyPhotos = ctx.message?.reply_to_message?.photo;
  const replyPrompt = clearText(ctx.message?.text, ctx.me)

  if (replyPhotos && replyPrompt) {
    return { photos: replyPhotos, prompt: replyPrompt };
  }

  return null
};

const getLargestPhotoUrl = async (ctx, photos) => {
  const largestPhoto = photos[photos.length - 1];
  const photoId = largestPhoto.file_id;

  const file = await ctx.telegram.getFile(photoId);
  return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
};

const handleAIImageMessage = async (ctx) => {
  const isImgCommand = getIsImgCommand(ctx);
  const imgObject = getImageToProcess(ctx);

  if (!isImgCommand || !imgObject) {
    console.log('No image to process or no command provided.');
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const fileUrl = await getLargestPhotoUrl(ctx, imgObject.photos);
    const aiResponse = await generateAIImageResponse(fileUrl, imgObject.prompt);

    await ctx.reply(`${aiResponse}`, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Error processing image request:', err);
    await ctx.reply('⚠️ Error while processing the image request.');
  }
};

module.exports = { handleAIImageMessage };