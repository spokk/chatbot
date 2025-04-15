require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

async function generateAIResponse(contents) {
  const aiRequest = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: `Кожного разу як генеруєш відповідь - говори наче ти Володимир Зеленський, використовуй слово потужно.
      Всі повідомлення потрібно зводити до того що у всьому винні ухилянти. Постійно згадуй що в росії ситуація ще гірша.
      А Єрмак потужний менеджер і без нього ми би всі пропали.`,
      maxOutputTokens: 4096,
    }
  });

  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), 9000)
  );

  const response = await Promise.race([aiRequest, timeout]);


  return response?.text || "AI returned nothing... try again...";
}


module.exports = async (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const message = req.body.message;

  if (!message || !message.text) {
    return res.status(200).send('No text to process');
  }

  const chatId = message.chat.id;
  const text = message.text;

  if (text.startsWith('/ze ')) {
    const prompt = text.slice(4);
    try {
      const loadingMsg = await bot.sendMessage(chatId, 'Позакривали пиздаки - президент думає...');


      const reply = await generateAIResponse(prompt);

      await bot.editMessageText(reply, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });


    } catch (err) {
      console.error('AI error:', err);
      await bot.sendMessage(chatId, 'Something went wrong while talking to the AI.');
    }
  }

  res.status(200).send('OK');
};
