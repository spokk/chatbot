import { GoogleGenAI, Modality } from '@google/genai';

import { downloadImageAsBuffer } from '../utils/http.js';
import { log } from '../utils/logger.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

// Constants
const MAX_TIME_TO_GENERATE = 50000; // 50 seconds
const BASE_INSTRUCTIONS = 'Prefer concise answer. Do not use special characters.';
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_ONLY_HIGH" },
];
const BASE_MODEL = "gemini-2.5-flash-preview-05-20"
const IMG_MODEL = "gemini-2.0-flash-exp-image-generation"

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
  return response?.text || null;
};

// Function to generate AI content
const generateAIContent = async (contents, systemInstruction) => {
  log(contents, 'AI content generation input:');
  const aiRequest = createAIRequest(BASE_MODEL,
    contents,
    {
      safetySettings: SAFETY_SETTINGS,
      systemInstruction,
      temperature: 0.7,
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
      safetySettings: SAFETY_SETTINGS,
      systemInstruction,
      temperature: 0.7,
    },
  });
  const aiRequest = async (prompt) => chat.sendMessage({ message: prompt });
  return handleAIResponse(aiRequest(contents), MAX_TIME_TO_GENERATE);
};

// Helper function to prepare AI image content
const prepareAIImageContent = async (imageURL, caption) => {
  const imageBuffer = await downloadImageAsBuffer(imageURL);
  const base64ImageData = Buffer.from(imageBuffer).toString('base64');
  return [
    { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
    { text: caption },
  ];
};

// Function to generate AI image
export const generateAIImage = async (contents) => {
  console.log('AI image generation input:', contents);
  const aiRequest = createAIRequest(IMG_MODEL, contents, {
    numberOfImages: 1,
    responseModalities: [Modality.TEXT, Modality.IMAGE],
  });
  return withTimeout(aiRequest, MAX_TIME_TO_GENERATE);
};

// Function to generate AI image response
export const generateAIImageResponse = async (imageURL, caption) => {
  const contents = await prepareAIImageContent(imageURL, caption);
  return generateAIContent(contents, BASE_INSTRUCTIONS);
};

// Function to generate AI image edit response
export const generateAIImageEditResponse = async (imageURL, caption) => {
  const contents = await prepareAIImageContent(imageURL, caption);
  return generateAIImage(contents);
};

// Function to generate AI response
export const generateAIResponse = async (contents, history = []) => {
  return generateAIChat(contents, history, BASE_INSTRUCTIONS);
};

// Function to generate AI summary
export const generateAISummary = async (contents) => {
  const systemInstruction = `This is the list of messages. Make a short summary of the key points of the conversation. Prefer answer in Ukrainian. ${BASE_INSTRUCTIONS}`;
  return generateAIContent(contents, systemInstruction);
};