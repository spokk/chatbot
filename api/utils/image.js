const { clearText } = require('../utils/text');

// Helper function to check if a command matches
const isCommand = (ctx, command) => {
  const text = ctx.message?.caption || ctx.message?.text || '';
  return text.startsWith(command) || text.startsWith(`${command}@${ctx.me}`);
};

// Check if the message is an image generation command
const getIsImgCommand = (ctx) => isCommand(ctx, '/img');

// Check if the message is an image edit command
const getIsEditCommand = (ctx) => isCommand(ctx, '/edit');

const getImageToProcess = (ctx) => {
  const prompt = clearText(ctx.message?.caption, ctx.me)
  const photos = ctx.message?.photo;

  if (photos && prompt) {
    return { photos, prompt };
  }

  const replyPhotos = ctx.message?.reply_to_message?.photo;
  const replySticker = ctx.message?.reply_to_message?.sticker?.thumbnail;
  const replyPrompt = clearText(ctx.message?.text, ctx.me)

  if (replyPrompt) {
    if (replyPhotos) return { photos: replyPhotos, prompt: replyPrompt };

    if (replySticker) return { photos: [replySticker], prompt: replyPrompt };
  }

  return null
};

// Get the URL of the largest photo
const getLargestPhotoUrl = async (ctx, photos) => {
  const largestPhoto = photos[photos.length - 1];
  const photoId = largestPhoto.file_id;

  const file = await ctx.telegram.getFile(photoId);
  return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
};

// Helper function to handle missing image data
const handleMissingImageData = async (ctx, response) => {
  console.error('AI generated no image:', { content: response.candidates[0]?.content });
  const fallbackMessage = response.candidates[0]?.content?.parts[0]?.text || '⚠️ AI generated nothing. Try again...';
  await ctx.reply(`⚠️ ${fallbackMessage}`);
};

// Helper function to process a single image part
const processImagePart = async (ctx, part) => {
  if (part.inlineData) {
    const imageData = part.inlineData.data;
    const buffer = Buffer.from(imageData, 'base64');
    const options = {
      caption: `Here is your generated image, ${ctx.message.from?.first_name || ctx.message.from?.username}!`,
      reply_to_message_id: ctx.message.message_id
    };

    await ctx.replyWithPhoto({ source: buffer }, { ...options });

    return true
  }

  return false
};

// Main function to process AI image response
const processAIImageResponse = async (ctx, response) => {
  let repliedWithImg = false;

  const parts = response.candidates[0]?.content?.parts || [];

  for (const part of parts) {
    repliedWithImg = await processImagePart(ctx, part);

    if (repliedWithImg) return;
  }

  if (!repliedWithImg) await handleMissingImageData(ctx, response);
};


module.exports = {
  getIsImgCommand,
  getIsEditCommand,
  getImageToProcess,
  getLargestPhotoUrl,
  processAIImageResponse
};