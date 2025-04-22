const { Blob } = require('buffer');

const { GoogleGenAI, createUserContent, createPartFromUri } = require('@google/genai');

const { log } = require('../utils/logger');
const { getMimeType } = require('../utils/media');
const { downloadImageAsBuffer } = require('../utils/http');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000; // 50 seconds
const MAX_OUTPUT_TOKENS_CHAT = 800; // For Chat Responses: Use 500–900 tokens to keep responses concise and relevant.
const MAX_OUTPUT_TOKENS_SUMMARY = 450; // For Summaries: Use 300–500 tokens to ensure the summary is short and to the point.

const baseInstructions = 'Prefer answer in Ukrainian. Prioritize short and concise answer. Do not use special characters.';

// Helper function to handle timeouts
const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

// Helper function to generate AI content
const generateAIContent = async (contents, systemInstruction, maxOutputTokens) => {
  log(contents, 'AI content generation input:');

  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction,
      maxOutputTokens,
    },
  });

  const response = await withTimeout(aiRequest, MAX_TIME_TO_GENERATE);

  if (!response?.text) throw new Error("⚠️ AI returned nothing.");

  log(response.text, 'AI content generation response:');

  return response.text;
};

// Function to generate AI response
const generateAIResponse = async (contents) => {
  return generateAIContent(contents, baseInstructions, MAX_OUTPUT_TOKENS_CHAT);
};

// Function to generate AI summary
const generateAISummary = async (contents) => {
  const systemInstruction = `This is the list of messages. Make a short summary of the key points of the conversation. ${baseInstructions}`;

  return generateAIContent(contents, systemInstruction, MAX_OUTPUT_TOKENS_SUMMARY);
};

// Function to generate AI image response
const generateAIImageResponse = async (imageURL, caption) => {
  try {
    // Step 1: Download the image as a buffer
    const imageBuffer = await downloadImageAsBuffer(imageURL);

    // Step 2: Determine the MIME type
    const mimeType = getMimeType(imageURL);

    // Step 3: Convert the buffer to a Blob
    const blob = new Blob([imageBuffer], { type: mimeType });

    // Step 4: Upload the image to the AI service
    const image = await uploadImageToAI(blob, mimeType, imageBuffer.length);

    // Step 5: Prepare and generate AI content
    const contents = [
      createUserContent([
        `Prefer quick response. ${caption}`,
        createPartFromUri(image.uri, mimeType),
      ]),
    ];

    return generateAIContent(contents, baseInstructions, MAX_OUTPUT_TOKENS_CHAT);
  } catch (error) {
    console.error('Error processing image request:', error);
    throw error;
  }
};

// Helper function to upload the image to the AI service
const uploadImageToAI = async (blob, mimeType, sizeBytes) => {
  return await ai.files.upload({
    file: blob,
    config: {
      mimeType: mimeType,
    },
  });
};

module.exports = { generateAIResponse, generateAISummary, generateAIImageResponse };