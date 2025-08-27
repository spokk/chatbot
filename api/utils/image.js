// Helper function to check if a command matches
export const isCommand = (ctx, command) => {
  const text = ctx.message?.caption || ctx.message?.text || '';
  return text.startsWith(command) || text.startsWith(`${command}@${ctx.me}`);
};

// Check if the message is an image generation command
export const getIsAiCommand = (ctx) => 
  isCommand(ctx, '/ai') || isCommand(ctx, '/аі');

// Check if the message is an image edit command
export const getIsGenCommand = (ctx) => isCommand(ctx, '/gen');

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
