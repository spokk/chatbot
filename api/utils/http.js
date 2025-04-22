const axios = require('axios');

// Helper function to download the image as a buffer
const downloadImageAsBuffer = async (imageURL) => {
  const response = await axios({
    url: imageURL,
    method: 'GET',
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.data);
};

module.exports = {
  downloadImageAsBuffer,
};