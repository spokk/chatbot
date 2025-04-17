const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const MAX_TIME_TO_GENERATE = 50000;

const generateAIResponse = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      maxOutputTokens: 1600,
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

const generateAISummary = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: 'This is the list of messages. Summarize the main points of the conversation. Prefer answer in Ukrainian unless the user asks in English.',
      maxOutputTokens: 700, // Limit tokens for a concise summary
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