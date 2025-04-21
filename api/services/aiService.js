const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000; // 50 seconds

// Helper function to handle timeouts
const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

// Helper function to generate AI content
const generateAIContent = async (contents, systemInstruction, maxOutputTokens) => {
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

  return response.text;
};

// Function to generate AI response
const generateAIResponse = async (contents) => {
  const systemInstruction = 'Prefer answer in Ukrainian unless the user asks in English. Prioritize short and concise answers.';
  const maxOutputTokens = 900;
  return generateAIContent(contents, systemInstruction, maxOutputTokens);
};

// Function to generate AI summary
const generateAISummary = async (contents) => {
  const systemInstruction = 'This is the list of messages. Make a short summary of the key points of the conversation. Ignore commands like "/ai" and "/sum". Prefer answer in Ukrainian unless the user asks in English. Prioritize short and concise answers.';
  const maxOutputTokens = 500;
  return generateAIContent(contents, systemInstruction, maxOutputTokens);
};

module.exports = { generateAIResponse, generateAISummary };