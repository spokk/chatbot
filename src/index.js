require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require("@google/genai");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

async function main(contents) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
  });

  return response.text;
}

// Function to send messages in chunks if they exceed Telegram's limit (4096 characters)
async function sendMessageInChunks(bot, chatId, text) {
  const chunkSize = 4096;
  const chunks = [];

  // Split the text into smaller chunks if necessary
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  // Send each chunk as a separate message asynchronously
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk);
  }
}
// Listen for /ai command
bot.onText(/\/ai (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userInput = match[1]; // This captures the part of the message after "/ai"

  try {
    const aiResponse = await main(userInput);
    sendMessageInChunks(bot, chatId, aiResponse); // Send the response in chunks
  } catch (error) {
    bot.sendMessage(chatId, "Something went wrong. Try again.");
  }

});
