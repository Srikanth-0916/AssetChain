/**
 * Document Encryption Utility — AES-256-GCM authenticated encryption.
 *
 * Provides authenticated encryption with GCM auth tag, random IV per file,
 * and SHA-256 key derivation.
 *
 * Backwards Compatibility:
 *   Supports seamless decryption of legacy AES-256-CBC documents.
 *
 * What gets encrypted:
 *   - Government IDs (nominee records & KYC)
 *   - Death certificates (inheritance claims)
 *   - Legal probate documents (inheritance claims)
 *   - OCR extracted sensitive fields
 *   - Property ownership documents before database storage
 */

import * as crypto from 'crypto';
import { env } from '../config/env';

const GCM_ALGORITHM = 'aes-256-gcm';
const CBC_ALGORITHM = 'aes-256-cbc';
const GCM_IV_LENGTH = 12; // 96 bits for GCM
const CBC_IV_LENGTH = 16; // 128 bits for CBC fallback

/**
 * Derive a 32-byte (256-bit) encryption key from environment secrets.
 */
function deriveEncryptionKey(): Buffer {
  const secret = (env as any).DOCUMENT_ENCRYPTION_KEY || env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      '[Encryption] No valid encryption key available. ' +
      'Set DOCUMENT_ENCRYPTION_KEY or ensure JWT_SECRET is at least 16 characters.'
    );
  }

  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedDocument {
  /** Schema version: 1 = AES-256-CBC (legacy), 2 = AES-256-GCM (current) */
  version: number;
  /** Algorithm used: 'AES-256-GCM' (v2) or 'AES-256-CBC' (v1) */
  algorithm: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Encrypted ciphertext (base64) */
  encrypted: string;
  /** Authentication tag (base64) — required for AES-256-GCM (v2) */
  tag?: string;
}

/**
 * Encrypt string or Buffer using AES-256-GCM (v2 Authenticated Encryption).
 */
export function encryptDocument(data: string | Buffer): EncryptedDocument {
  const key = deriveEncryptionKey();
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv(GCM_ALGORITHM, key, iv);

  const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

  const encrypted = Buffer.concat([
    cipher.update(inputBuffer),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    version: 2,
    algorithm: 'AES-256-GCM',
    iv: iv.toString('base64'),
    encrypted: encrypted.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt an encrypted document based on explicit version metadata.
 * Version 1 → AES-256-CBC (legacy)
 * Version 2 → AES-256-GCM (current)
 */
export function decryptDocument(encryptedDoc: EncryptedDocument): Buffer {
  const key = deriveEncryptionKey();
  const iv = Buffer.from(encryptedDoc.iv, 'base64');
  const encryptedData = Buffer.from(encryptedDoc.encrypted, 'base64');

  // Explicit Version 1 / CBC check
  if (encryptedDoc.version === 1 || encryptedDoc.algorithm === CBC_ALGORITHM || encryptedDoc.algorithm === 'AES-256-CBC' || !encryptedDoc.tag) {
    const decipher = crypto.createDecipheriv(CBC_ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  // Explicit Version 2 / GCM Decryption with Authentication Tag Verification
  const decipher = crypto.createDecipheriv(GCM_ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(encryptedDoc.tag, 'base64'));

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
}

/**
 * Decrypt and return as UTF-8 string.
 */
export function decryptDocumentToString(encryptedDoc: EncryptedDocument): string {
  return decryptDocument(encryptedDoc).toString('utf8');
}

/**
 * Encrypt a sensitive field to a JSON string.
 */
export function encryptField(value: string): string {
  if (!value) return '';
  const doc = encryptDocument(value);
  return JSON.stringify(doc);
}

/**
 * Decrypt a field previously encrypted with encryptField().
 * Returns original plaintext string.
 */
export function decryptField(encryptedJson: string): string {
  if (!encryptedJson) return '';
  try {
    const doc: EncryptedDocument = JSON.parse(encryptedJson);
    return decryptDocumentToString(doc);
  } catch {
    // Return raw value if not JSON/encrypted (migration fallback)
    return encryptedJson;
  }
}

/**
 * Mask a sensitive string for display — e.g. "GOV-ID-12345678" → "GOV-****5678"
 */
export function maskSensitiveField(value: string, showChars = 4): string {
  if (!value || value.length <= showChars * 2) return '****';
  return `${value.substring(0, showChars)}${'*'.repeat(Math.max(4, value.length - showChars * 2))}${value.substring(value.length - showChars)}`;
}

/**
 * Mask a wallet address for display — e.g. "0x1234567890abcdef..." → "0x1234...cdef"
 */
export function maskWalletAddress(address: string): string {
  if (!address || address.length < 10) return '0x****';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
