import { GoogleGenAI, Modality } from '@google/genai';

import { handleAIResponse, withTimeout } from '../utils/request.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 55000; // 55 seconds
const BASE_INSTRUCTIONS = `
Ground answers using Google Search when possible.
Answer as briefly as possible: max 2 sentences, under 30 words.
No greetings or extra context; only relevant facts.
Respond in the same language as the last request.
`;
const BASE_MODEL = "gemini-2.5-flash"
const IMG_MODEL = "gemini-2.0-flash-exp-image-generation"
const VOICE_MODEL = "gemini-2.5-flash-preview-tts"

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
];

export const requestAIChat = async (contents, history, systemInstruction = BASE_INSTRUCTIONS) => {
  const chat = ai.chats.create({
    model: BASE_MODEL,
    history,
    config: {
      systemInstruction,
      tools: [{
        googleSearch: {},
      }],
      safetySettings
    },
  });

  const aiRequest = async (prompt) => chat.sendMessage({ message: prompt });

  return handleAIResponse(aiRequest(contents), MAX_TIME_TO_GENERATE);
};

export const generateAIContent = async (contents, systemInstruction = BASE_INSTRUCTIONS) => {
  const aiRequest = ai.models.generateContent({
    model: BASE_MODEL,
    contents,
    config: {
      systemInstruction,
      safetySettings
    }
  });

  return handleAIResponse(aiRequest, MAX_TIME_TO_GENERATE);
};

export const generateAIImage = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: IMG_MODEL,
    contents,
    config: {
      numberOfImages: 1,
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      safetySettings
    }
  });

  return withTimeout(aiRequest, MAX_TIME_TO_GENERATE);
};

export const generateAIVoice = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: VOICE_MODEL,
    contents: [{ parts: [{ text: contents }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Sadaltager' },
        },
      },
      safetySettings
    }
  });

  return withTimeout(aiRequest, MAX_TIME_TO_GENERATE);;
};