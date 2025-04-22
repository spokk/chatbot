const { GoogleGenAI } = require('@google/genai');

const { log } = require('../utils/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000; // 50 seconds
const MAX_OUTPUT_TOKENS_CHAT = 800; // For Chat Responses: Use 500–900 tokens to keep responses concise and relevant.
const MAX_OUTPUT_TOKENS_SUMMARY = 450; // For Summaries: Use 300–500 tokens to ensure the summary is short and to the point.

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
  const systemInstruction = 'Prefer answer in Ukrainian unless the user asks otherwise. Prioritize short and concise answer.';

  return generateAIContent(contents, systemInstruction, MAX_OUTPUT_TOKENS_CHAT);
};

// Function to generate AI summary
const generateAISummary = async (contents) => {
  const systemInstruction = 'This is the list of messages. Make a short summary of the key points of the conversation. Prefer answer in Ukrainian unless the user asks in English. Prioritize short and concise answer.';

  return generateAIContent(contents, systemInstruction, MAX_OUTPUT_TOKENS_SUMMARY);
};

module.exports = { generateAIResponse, generateAISummary };