import { getIsGenCommand, getIsAiCommand } from '../utils/image.js';
import { handleAIImage } from './aiImageHandler.js';
import { handleAIMessage } from './aiHandler.js';

export const imageHandlerRouter = async (ctx) => {
  if (getIsGenCommand(ctx)) {
    await handleAIImage(ctx)
    return
  }

  if (getIsAiCommand(ctx)) {
    await handleAIMessage(ctx)
    return
  }
}