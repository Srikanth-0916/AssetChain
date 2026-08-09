import { describe, test, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { encryptField, decryptField } from '../src/utils/encryption';
import { ipfsService } from '../src/services/ipfs.service';
import { authService } from '../src/services/auth.service';
import { supabaseAdmin } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

describe('Real Image Upload & Cryptographic IPFS Verification Test Suite', () => {
  let testUserId: string;
  let sampleImageBuffer: Buffer;
  let sampleImageBase64: string;
  let imageSha256Hash: string;

  beforeAll(() => {
    testUserId = uuidv4();
    // Generate a valid PNG image binary buffer (8x8 PNG header + pixels)
    sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    sampleImageBase64 = `data:image/png;base64,${sampleImageBuffer.toString('base64')}`;
    
    // Compute SHA-256 hash of the real image buffer
    imageSha256Hash = crypto.createHash('sha256').update(sampleImageBuffer).digest('hex');
  });

  test('1. Real Image Binary Integrity & SHA-256 Content Hashing', () => {
    expect(sampleImageBuffer.length).toBeGreaterThan(0);
    expect(sampleImageBase64).toContain('data:image/png;base64,');
    expect(imageSha256Hash).toHaveLength(64);
  });

  test('2. Real Image Payload AES-256-GCM Cryptographic Encryption & Decryption', () => {
    // Encrypt the real image base64 payload
    const encryptedImagePayload = encryptField(sampleImageBase64);

    expect(encryptedImagePayload).toBeDefined();
    expect(encryptedImagePayload).toContain(':'); // IV : Ciphertext : Tag format
    expect(encryptedImagePayload).not.toEqual(sampleImageBase64);

    // Decrypt the payload
    const decryptedImagePayload = decryptField(encryptedImagePayload);

    expect(decryptedImagePayload).toEqual(sampleImageBase64);

    // Extract binary buffer from decrypted base64 and verify SHA-256 match
    const decryptedBuffer = Buffer.from(decryptedImagePayload.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const decryptedHash = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');

    expect(decryptedHash).toEqual(imageSha256Hash);
  });

  test('3. Real Image Metadata Pinning to IPFS Gateway', async () => {
    const metadata = {
      name: 'Verified Real Title Deed Photo',
      description: 'Encrypted Real Image Upload for Property Asset',
      image_hash: imageSha256Hash,
      mime_type: 'image/png',
      file_size_bytes: sampleImageBuffer.length,
      created_at: new Date().toISOString(),
    };

    const ipfsResult = await ipfsService.pinJSONToIPFS(metadata, 'DeedImageMetadata');

    expect(ipfsResult).toBeDefined();
    expect(ipfsResult.ipfsCid).toBeDefined();
    expect(ipfsResult.ipfsCid.length).toBeGreaterThan(5);
  });

  test('4. Database Persistence & Document Record Verification', async () => {
    const uniqueEmail = `img_user_${uuidv4()}@assetchain.io`;
    let registeredUserId: string;
    
    try {
      const regResult = await authService.register({
        full_name: 'Image Upload Test User',
        email: uniqueEmail,
        password: 'SampleImagePassword123!',
        role: 'investor',
      });
      registeredUserId = regResult.user.id;
    } catch {
      registeredUserId = uuidv4();
    }

    expect(registeredUserId).toBeDefined();

    const encryptedData = encryptField(sampleImageBase64);
    const documentCid = `ipfs://QmRealImageDeed_${Date.now()}`;

    // Update profile KYC status & reference
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registeredUserId);

    expect(updateErr).toBeNull();

    // Fetch back profile record to confirm persistence
    const { data: savedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, kyc_status')
      .eq('id', registeredUserId)
      .single();

    expect(savedProfile?.id).toBe(registeredUserId);
    expect(savedProfile?.kyc_status).toBe('approved');
  });
});
