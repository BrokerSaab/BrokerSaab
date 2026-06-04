import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

// Use fallback key if env token is missing for development safety
const ENCRYPTION_KEY_SECRET = process.env.JWT_ACCESS_SECRET || 'brokersaab_fallback_sec_key_long_enough_32';

function getDerivedKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive plain text using AES-256-GCM.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getDerivedKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Return serialized bundle: salt:iv:authTag:encryptedPayload
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt secure ciphertext using AES-256-GCM.
 */
export function decrypt(encryptedBundle: string): string {
  try {
    const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedBundle.split(':');
    if (!saltHex || !ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid secure bundle format');
    }

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const key = getDerivedKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Failed to decrypt data.');
  }
}
