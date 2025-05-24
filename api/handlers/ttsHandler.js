import { generateAIVoice } from '../services/aiService.js';
import { clearText } from '../utils/text.js';
import { log } from '../utils/logger.js';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function convertBufferToMp3(inputBuffer, channels = 1, rate = 48000) {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null);

    const chunks = [];
    ffmpeg(inputStream)
      .inputFormat('s16le') // PCM 16-bit little-endian
      .audioChannels(channels)
      .audioFrequency(rate)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on('data', chunk => chunks.push(chunk));
  });
}

export const handleAITextToSpeech = async (ctx) => {
  const prompt = clearText(ctx.message?.text, ctx.me);

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

      const mp3Buffer = await convertBufferToMp3(audioBuffer);

      await ctx.replyWithAudio(
        { source: mp3Buffer, filename: 'tts.mp3' },
        { reply_to_message_id: ctx.message.message_id, title: 'AI Voice' }
      );
    } catch (err) {
      console.error('Error converting audio buffer to MP3:', err);
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