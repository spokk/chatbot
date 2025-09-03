import wav from 'wav';
import { Readable } from 'stream';

import { generateAIVoice } from '../services/aiService.js';
import { getMessage } from '../utils/text.js';

import { logger } from '../utils/logger.js';


function pcmBufferToWavBuffer(pcmBuffer, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const inputStream = new Readable();
    inputStream.push(pcmBuffer);
    inputStream.push(null);

    const chunks = [];
    writer.on('data', chunk => chunks.push(chunk));
    writer.on('finish', () => resolve(Buffer.concat(chunks)));
    writer.on('error', reject);

    inputStream.pipe(writer);
  });
}

export const handleAITextToSpeech = async (ctx) => {
  const prompt = getMessage(ctx);

  logger.info('TTS command invoked.');

  if (!prompt) {
    await ctx.reply(
      '⚠️ No input provided. Please send a prompt for voice generation.',
      { reply_to_message_id: ctx.message.message_id }
    );
    return;
  }

  try {
    await ctx.sendChatAction('upload_audio');

    const response = await generateAIVoice(prompt);

    logger.info({ response }, 'AI voice generation response:');

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!data) {
      await ctx.reply('⚠️ No voice response from AI. Try again...', { reply_to_message_id: ctx.message.message_id });
      return;
    }

    try {
      const audioBuffer = Buffer.from(data, 'base64');

      if (!audioBuffer) {
        await ctx.reply('⚠️ No audio buffer created. Try again...', { reply_to_message_id: ctx.message.message_id });
        return;
      }

      const wavBuffer = await pcmBufferToWavBuffer(audioBuffer);

      ctx.deleteMessage(ctx.message.message_id).catch(() => { });
      await ctx.replyWithAudio({ source: wavBuffer }, { title: prompt, performer: 'AI Voice' });
    } catch (err) {
      logger.error({ err }, 'Error converting audio buffer to WAV:');
      await ctx.reply('⚠️ Error while converting audio data. Try again...', { reply_to_message_id: ctx.message.message_id });
    }

  } catch (err) {
    logger.error({ err }, 'Error processing voice request:');

    // Handle 429 Too Many Requests
    if (err?.response?.status === 429 || err?.message?.includes('429')) {
      await ctx.reply(
        '🚫 Rate limit exceeded: You have reached the maximum number of requests. Please try again tomorrow.',
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    const errorMessage = err?.error?.message || '⚠️ Error while processing the voice generation request. Try again...';
    await ctx.reply(errorMessage, { reply_to_message_id: ctx.message.message_id });
  }
}