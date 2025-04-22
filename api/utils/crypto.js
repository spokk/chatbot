const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = process.env.ALGORITHM;
const IV_LENGTH = 16; // Initialization vector length

// Function to encrypt text
const encryptText = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`; // Combine IV and encrypted text
};

// Function to decrypt text
const decryptText = (encryptedText) => {
  // Check if the text is in the expected encrypted format
  if (!encryptedText.includes(':')) {
    return encryptedText; // Return the text as-is if it's not encrypted
  }

  try {
    const [iv, encrypted] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return encryptedText; // Return the original text if decryption fails
  }
};

module.exports = { encryptText, decryptText };