import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Заметки клиента — AES-256-GCM. Формат: "v1:" + base64(iv[12] | tag[16] | ciphertext).
const PREFIX = 'v1:';

export function parseNotesKey(base64: string): Buffer {
  const key = Buffer.from(base64, 'base64');
  if (key.length !== 32) throw new Error('NOTES_ENCRYPTION_KEY must be 32 bytes in base64');
  return key;
}

export function encryptNote(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}

export function decryptNote(stored: string, key: Buffer): string {
  if (!stored.startsWith(PREFIX)) throw new Error('Unknown note format');
  const buf = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}
