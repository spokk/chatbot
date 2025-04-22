const mime = require('mime-types'); // Import the mime-types library

const getMimeType = (imageURL) => {
  const extension = imageURL.split('.').pop().toLowerCase(); // Get the file extension
  let mimeType = mime.lookup(extension); // Infer the MIME type

  // Fallback to default MIME type if not recognized
  if (!mimeType || !['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
    console.warn('Unable to determine MIME type from extension. Falling back to default MIME type.');
    mimeType = 'image/jpeg'; // Default to JPEG
  }

  return mimeType;
};

module.exports = { getMimeType };