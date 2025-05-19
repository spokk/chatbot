import { getIsEditCommand, getIsImgCommand } from '../utils/image.js';
import { handleAIImageEdit } from './imageEditHandler.js';
import { handleAIImageRecognition } from './imageRecognitionHandler.js';

export const imageHandlerRouter = async (ctx) => {
  if (getIsEditCommand(ctx)) {
    await handleAIImageEdit(ctx)
    return
  }

  if (getIsImgCommand(ctx)) {
    await handleAIImageRecognition(ctx)
    return
  }
}