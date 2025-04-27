// Helper function to download the image as a buffer
const downloadImageAsBuffer = async (imageURL) => {
  const response = await fetch(imageURL);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = { downloadImageAsBuffer };