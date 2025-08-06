import removeMarkdown from 'remove-markdown';

import { GoogleGenAI, Modality } from '@google/genai';

import { downloadImageAsBuffer } from '../utils/http.js';
import { log } from '../utils/logger.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

// Constants
const MAX_TIME_TO_GENERATE = 55000; // 55 seconds
const BASE_INSTRUCTIONS = `
Respond only with the minimal required words.
Include only verified facts relevant to the question.
No explanations, no filler, no extra context.
No speculation or invented details.
`;
const BASE_MODEL = "gemini-2.5-flash"
const IMG_MODEL = "gemini-2.0-flash-exp-image-generation"
const VOICE_MODEL = "gemini-2.5-flash-preview-tts"

// Grounding with Google Search
const groundingTool = {
  googleSearch: {},
};

// Helper function to handle timeouts
const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

// Helper function to create AI request
const createAIRequest = (model, contents, config) => {
  return ai.models.generateContent({
    model,
    contents,
    config,
  });
};

// Helper function to handle AI response
const handleAIResponse = async (aiRequest, timeout) => {
  const response = await withTimeout(aiRequest, timeout);
  log(response, 'AI chat generation response:');
  const plainText = removeMarkdown(response?.text || '');
  return plainText || null;
};

// Function to generate AI content
const generateAIContent = async (contents, systemInstruction = null) => {
  log(contents, 'AI content generation input:');
  const aiRequest = createAIRequest(BASE_MODEL,
    contents,
    {
      systemInstruction,
    });
  return handleAIResponse(aiRequest, MAX_TIME_TO_GENERATE);
};

// Function to generate AI chat
const generateAIChat = async (contents, history, systemInstruction) => {
  log(contents, 'AI chat generation input:');
  const chat = ai.chats.create({
    model: BASE_MODEL,
    history,
    config: {
      systemInstruction,
      tools: [groundingTool],
    },
  });
  const aiRequest = async (prompt) => chat.sendMessage({ message: prompt });
  return handleAIResponse(aiRequest(contents), MAX_TIME_TO_GENERATE);
};

// Helper function to prepare AI image content
const prepareAIImageContent = async (caption, imageURL) => {
  const imageBuffer = await downloadImageAsBuffer(imageURL);
  const base64ImageData = Buffer.from(imageBuffer).toString('base64');
  return [
    { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
    { text: caption },
  ];
};

// Function to generate AI image
export const generateAIImage = async (contents) => {
  const aiRequest = createAIRequest(IMG_MODEL, contents, {
    numberOfImages: 1,
    responseModalities: [Modality.TEXT, Modality.IMAGE],
  });
  return withTimeout(aiRequest, MAX_TIME_TO_GENERATE);
};

export const generateAIVoice = async (contents) => {
  log(contents, 'AI voice generation input:');
  const aiRequest = createAIRequest(VOICE_MODEL,
    [{ parts: [{ text: contents }] }],
    {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Sadaltager' },
        },
      },
    });

  return withTimeout(aiRequest, MAX_TIME_TO_GENERATE);;
};

// Function to generate AI image response
export const getAIImageRecognitionResponse = async (caption, imageURL) => {
  const contents = await prepareAIImageContent(caption, imageURL);
  return generateAIContent(contents);
};

// Function to generate AI image edit response
export const getAIImageGenerationResponse = async (caption, imageURL) => {
  if (imageURL) {
    const contents = await prepareAIImageContent(caption, imageURL);
    return generateAIImage(contents);
  }

  return generateAIImage(caption);
};

// Function to generate AI response
export const getAIResponse = async (contents, history = []) => {
  return generateAIChat(contents, history, BASE_INSTRUCTIONS);
};

// Function to generate AI summary
export const getAISummary = async (contents) => {
  const systemInstruction = `This is the list of messages. Make a short summary of the key points of the conversation. Prefer answer in Ukrainian. ${BASE_INSTRUCTIONS}`;
  return generateAIContent(contents, systemInstruction);
};