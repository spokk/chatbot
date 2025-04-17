const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const generateAIResponse = async (contents) => {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: 'Respond in Markdown format suitable for Telegram.',
      maxOutputTokens: 3800,
    }
  });

  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), 50000)
  );

  const response = await Promise.race([aiRequest, timeout]);

  if (!response?.text) {
    throw new Error("AI returned nothing.");
  }

  // Ensure the response is safe for Telegram Markdown
  const formattedText = response.text
    .replace(/_/g, '\\_') // Escape underscores
    .replace(/\*/g, '\\*') // Escape asterisks
    .replace(/\[/g, '\\[') // Escape square brackets
    .replace(/`/g, '\\`'); // Escape backticks

  return formattedText;
};

module.exports = { generateAIResponse };