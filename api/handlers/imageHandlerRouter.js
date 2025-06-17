import { getIsEditCommand, getIsAiCommand } from '../utils/image.js';
import { handleAIImageEdit } from './imageEditHandler.js';
import { handleAIMessage } from './aiHandler.js';

export const imageHandlerRouter = async (ctx) => {
  if (getIsEditCommand(ctx)) {
    await handleAIImageEdit(ctx)
    return
  }

  if (getIsAiCommand(ctx)) {
    await handleAIMessage(ctx)
    return
  }
}