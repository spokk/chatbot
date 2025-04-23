const { GoogleGenAI } = require('@google/genai');

const { log } = require('../utils/logger');
const { downloadImageAsBuffer } = require('../utils/http');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000; // 50 seconds
const MAX_OUTPUT_TOKENS_CHAT = 500; // For Chat Responses: Use 500–900 tokens to keep responses concise and relevant.
const MAX_OUTPUT_TOKENS_SUMMARY = 400; // For Summaries: Use 300–500 tokens to ensure the summary is short and to the point.

const baseInstructions = 'Prefer concise answer. Do not use special characters.';

// Helper function to handle timeouts
const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_ONLY_HIGH",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_ONLY_HIGH",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_ONLY_HIGH",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_ONLY_HIGH",
  },
  {
    category: "HARM_CATEGORY_CIVIC_INTEGRITY",
    threshold: "BLOCK_ONLY_HIGH",
  },
];

// Helper function to generate AI content
const generateAIContent = async (contents, systemInstruction, maxOutputTokens) => {
  log(contents, 'AI content generation input:');

  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      safetySettings: safetySettings,
      systemInstruction,
      temperature: 0.7,
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
  const systemInstruction = `This is the list of messages. Make a short summary of the key points of the conversation. Prefer answer in Ukrainian. ${baseInstructions}`;

  return generateAIContent(contents, systemInstruction, MAX_OUTPUT_TOKENS_SUMMARY);
};

// Function to generate AI image response
const generateAIImageResponse = async (imageURL, caption) => {
  try {
    // Step 1: Download the image as a buffer
    const imageBuffer = await downloadImageAsBuffer(imageURL);

    // Step 2: Convert the buffer to a base64
    const base64ImageData = Buffer.from(imageBuffer).toString('base64');

    // Step 3: Prepare and generate AI content
    const contents = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        },
      },
      { text: caption }
    ];

    return generateAIContent(contents, baseInstructions, MAX_OUTPUT_TOKENS_CHAT);
  } catch (error) {
    console.error('Error processing image request:', error);
    throw error;
  }
};

module.exports = { generateAIResponse, generateAISummary, generateAIImageResponse };