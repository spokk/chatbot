const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000; // 50 seconds

const generateAIResponse = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: 'Prefer answer in Ukrainian unless the user asks in English. Prioritize short and concise answers.',
      maxOutputTokens: 900,
    }
  });

  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), MAX_TIME_TO_GENERATE)
  );

  const response = await Promise.race([aiRequest, timeout]);

  if (!response?.text) throw new Error("AI returned nothing.");

  return response.text
};

const generateAISummary = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: 'This is the list of messages. Make a short summary of the key points of the conversation. Ignore commands like "/ai" and "/sum". Prefer answer in Ukrainian unless the user asks in English. Prioritize short and concise answers.',
      maxOutputTokens: 500, // Limit tokens for a concise summary
    }
  });

  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), MAX_TIME_TO_GENERATE)
  );

  const response = await Promise.race([aiRequest, timeout]);

  if (!response?.text) {
    throw new Error("AI returned nothing.");
  }

  return response.text
};

module.exports = { generateAIResponse, generateAISummary };