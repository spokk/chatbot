// Helper function to check if a command matches
export const isCommand = (ctx, command) => {
  const text = ctx.message?.caption || ctx.message?.text || '';
  return text.startsWith(command) || text.startsWith(`${command}@${ctx.me}`);
};

// Check if the message is an image generation command
export const getIsAiCommand = (ctx) => isCommand(ctx, '/ai');

// Check if the message is an image edit command
export const getIsEditCommand = (ctx) => isCommand(ctx, '/edit');

export const getImagesToProcess = (ctx) => {
  const photos = ctx.message?.photo;
  if (photos) return photos

  const replyPhotos = ctx.message?.reply_to_message?.photo;
  if (replyPhotos) return replyPhotos

  const replySticker = ctx.message?.reply_to_message?.sticker?.thumbnail;
  if (replySticker) return [replySticker]

  return null
};

// Get the URL of the largest photo
export const getLargestPhotoUrl = async (ctx, photos) => {
  const largestPhoto = photos[photos.length - 1];
  const photoId = largestPhoto.file_id;

  const file = await ctx.telegram.getFile(photoId);
  return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
};

// Helper function to handle missing image data
export const handleMissingImageData = async (ctx, response) => {
  console.error('AI generated no image: ', response);
  const fallbackMessage = 'AI generated no image. Try again...';
  await ctx.reply(`⚠️ ${fallbackMessage}`, { reply_to_message_id: ctx.message.message_id });
};

// Main function to process AI image response
export const processAIImageResponse = async (ctx, response) => {
  const parts = response?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part?.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, 'base64');

      await ctx.replyWithPhoto({ source: buffer }, { reply_to_message_id: ctx.message.message_id });

      return
    }
  }

  await handleMissingImageData(ctx, response);
};