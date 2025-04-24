const { getIsEditCommand, getIsImgCommand } = require('../utils/image');
const { handleAIImageEdit } = require('./imageEditHandler');
const { handleAIImageRecognition } = require('./imageRecognitionHandler');

const imageHandlerRouter = async (ctx) => {
  if (getIsEditCommand(ctx)) {
    await handleAIImageEdit(ctx)
    return
  }

  if (getIsImgCommand(ctx)) {
    await handleAIImageRecognition(ctx)
    return
  }
}

module.exports = { imageHandlerRouter };