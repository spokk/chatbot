import removeMarkdown from 'remove-markdown';

export const downloadImageAsBuffer = async (imageURL) => {
  const response = await fetch(imageURL);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

export const handleAIResponse = async (aiRequest, timeout) => {
  const response = await withTimeout(aiRequest, timeout);

  if (!response?.text) {
    logger.error({ response }, "Empty or invalid response from Gemini AI.");
    return null;
  }

  return removeMarkdown(response.text);
};