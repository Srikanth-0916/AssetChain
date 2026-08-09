import { describe, test, expect, beforeAll } from 'vitest';
import { assetService } from '../src/services/asset.service';
import { ipfsService } from '../src/services/ipfs.service';
import { supabaseAdmin } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

describe('Asset Document AES-256-GCM Encryption & Authorization Tests', () => {
  let ownerId: string;
  let testAssetId: string;
  let testDocId: string;
  const rawDeedText = 'CONFIDENTIAL DEED & TITLE DEED PERMIT #99102-CA';

  beforeAll(async () => {
    // Fetch or create a test owner profile
    const { data: owner } = await supabaseAdmin.from('profiles').select('id').limit(1).maybeSingle();
    if (owner) {
      ownerId = owner.id;
    } else {
      const testUserId = uuidv4();
      const { data: newProfile, error } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: testUserId,
            full_name: 'Test Asset Owner',
            email: `testowner_${Date.now()}@example.com`,
            role: 'asset_owner',
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      ownerId = newProfile?.id || testUserId;
    }
  });

  test('1. Document Upload Path ALWAYS Encrypts Payload with AES-256-GCM', async () => {
    // Encrypt via ipfsService helper
    const pinResult = await ipfsService.pinEncryptedDocumentToIPFS(rawDeedText, 'deed.pdf');
    expect(pinResult.ipfsCid).toBeDefined();

    // Create Asset with Document Attachment
    const asset = await assetService.createAsset(ownerId, {
      title: 'Encryption Assertion Asset ' + Date.now().toString().slice(-4),
      description: 'Asset for testing document encryption guardrails.',
      asset_type: 'commercial_property',
      valuation: 1000000,
      token_supply: 5000,
      documents: [
        {
          document_type: 'title_deed',
          file_name: 'deed.pdf',
          ipfs_cid: pinResult.ipfsCid,
          mime_type: 'application/pdf',
          file_size_bytes: 1024,
          encrypted_data: rawDeedText,
        },
      ],
    });

    testAssetId = asset.id;

    // Fetch inserted document row directly from Supabase DB
    const { data: docRows } = await supabaseAdmin
      .from('asset_documents')
      .select('*')
      .eq('asset_id', testAssetId);

    expect(docRows).toBeDefined();
    expect(docRows!.length).toBeGreaterThan(0);

    const doc = docRows![0];
    testDocId = doc.id;

    // ASSERT: Plaintext must NEVER be present in encrypted_data column
    expect(doc.encrypted_data).not.toContain(rawDeedText);
    expect(doc.encrypted_data).toContain('"algorithm":"AES-256-GCM"');
    expect(doc.encrypted_data).toContain('"version":2');
  });

  test('2. Authorized User (Owner / Verifier / Admin) Can Decrypt Document', async () => {
    const result = await assetService.getDecryptedDocument(testDocId, {
      id: ownerId,
      role: 'asset_owner',
    });

    expect(result.decryptedContent).toEqual(rawDeedText);
  });

  test('3. Unauthorized User Request is Rejected with Authorization Error', async () => {
    await expect(
      assetService.getDecryptedDocument(testDocId, {
        id: uuidv4(),
        role: 'investor',
      })
    ).rejects.toThrow(/Unauthorized/);
  });
});
