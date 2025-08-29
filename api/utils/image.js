import { downloadImageAsBuffer } from './request.js';

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

export const prepareAIImageContent = async (caption, imageURL) => {
  const imageBuffer = await downloadImageAsBuffer(imageURL);
  const base64ImageData = Buffer.from(imageBuffer).toString('base64');
  return [
    { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
    { text: caption },
  ];
};
