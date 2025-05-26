import { generateAIVoice } from '../services/aiService.js';
import { clearText } from '../utils/text.js';
import { log } from '../utils/logger.js';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function convertBufferToWav(inputBuffer, channels = 2, rate = 48000) {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null);

    const chunks = [];
    ffmpeg(inputStream)
      .inputFormat('s16le') // PCM 16-bit little-endian
      .audioChannels(channels)
      .audioFrequency(rate)
      .audioCodec('pcm_s16le') // 16-bit PCM for WAV
      .format('wav')
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on('data', chunk => chunks.push(chunk));
  });
}

export const handleAITextToSpeech = async (ctx) => {
  const prompt = clearText(ctx.message?.text, ctx.me) || clearText(ctx.message?.reply_to_message?.text, ctx.me);

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

    log(response, 'AI voice generation response:');

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

      const wavBuffer = await convertBufferToWav(audioBuffer);

      ctx.deleteMessage(ctx.message.message_id).catch(() => { });
      await ctx.replyWithAudio({ source: wavBuffer }, { title: prompt, performer: 'AI Voice' });
    } catch (err) {
      console.error('Error converting audio buffer to WAV:', err);
      await ctx.reply('⚠️ Error while converting audio data. Try again...', { reply_to_message_id: ctx.message.message_id });
    }

  } catch (error) {
    console.error('Error processing voice request:', error);

    // Handle 429 Too Many Requests
    if (error?.response?.status === 429 || error?.message?.includes('429')) {
      await ctx.reply(
        '🚫 Rate limit exceeded: You have reached the maximum number of requests. Please try again tomorrow.',
        { reply_to_message_id: ctx.message.message_id }
      );
      return;
    }

    await ctx.reply('⚠️ Error while processing the voice generation request. Try again...', { reply_to_message_id: ctx.message.message_id });
  }
}