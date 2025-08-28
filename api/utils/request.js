import removeMarkdown from 'remove-markdown';

// Helper function to download the image as a buffer
export const downloadImageAsBuffer = async (imageURL) => {
  const response = await fetch(imageURL);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Helper function to handle timeouts
export const withTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ text: '⚠️ AI is taking too long to respond.' }), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

export const handleAIResponse = async (aiRequest, timeout) => {
  const response = await withTimeout(aiRequest, timeout);

  return response?.text ? removeMarkdown(response.text) : null;
};