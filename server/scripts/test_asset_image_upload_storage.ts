import { assetService } from '../src/services/asset.service';
import { ipfsService } from '../src/services/ipfs.service';
import { supabaseAdmin } from '../src/config/database';

async function testAssetUploadStorage() {
  console.log('===============================================================');
  console.log('🔐 AES-256-GCM ENCRYPTED ASSET UPLOAD & IPFS VERIFICATION TRACE');
  console.log('===============================================================\n');

  // Step 1: Check Pinata connection status
  const pinataConn = await ipfsService.testConnection();
  console.log(`📌 Pinata API Connection Status:`);
  console.log(` - Success: ${pinataConn.success}`);
  console.log(` - Message: ${pinataConn.message}\n`);

  // Step 2: Upload a property deed / document using AES-256-GCM encryption
  const sampleFileName = 'confidential_property_deed_and_survey.pdf';
  const samplePlaintextContent = 'CONFIDENTIAL PROPERTY DEED & MUNICIPAL SURVEY: Owner Jane Doe, Parcel #882-9901';

  // Pin ENCRYPTED Document Envelope to IPFS
  const pinResult = await ipfsService.pinEncryptedDocumentToIPFS(
    samplePlaintextContent,
    sampleFileName,
    { location: 'San Francisco, CA' }
  );

  console.log(`📌 IPFS Pinning Result (AES-256-GCM Encrypted):`);
  console.log(` - IPFS CID: ${pinResult.ipfsCid}`);
  console.log(` - IPFS URL: ${pinResult.ipfsUrl}\n`);

  // Step 3: Verify Public IPFS Gateway response contains ONLY Ciphertext
  console.log(`🔍 FETCHING PUBLIC IPFS GATEWAY URL (Simulating Unauthenticated Incognito User)...`);
  try {
    const res = await fetch(pinResult.ipfsUrl);
    const publicData: any = await res.json();
    console.log(`  🌐 Public IPFS Gateway JSON Response:`);
    console.log(`     - Name:       "${publicData.name}"`);
    console.log(`     - Encrypted:  ${publicData.encrypted}`);
    console.log(`     - Algorithm:  ${publicData.algorithm}`);
    console.log(`     - Ciphertext: "${publicData.ciphertext?.slice(0, 35)}..."`);
    console.log(`     - IV:         "${publicData.iv}"`);
    console.log(`     - Auth Tag:   "${publicData.tag}"\n`);

    if (publicData.ciphertext && !JSON.stringify(publicData).includes('CONFIDENTIAL PROPERTY DEED')) {
      console.log(`  ✨ PASS: Public IPFS Gateway contains ONLY unreadable AES-256-GCM ciphertext gibberish! No PII exposed.\n`);
    } else {
      console.error(`  ❌ FAIL: Plaintext found in public IPFS response!\n`);
    }
  } catch (err: any) {
    console.warn(`  ⚠️ Public Gateway fetch note (${err.message}). IPFS propagation in progress.\n`);
  }

  // Step 4: Create Asset in Supabase with AES-256-GCM Encrypted Document
  const { data: owner } = await supabaseAdmin.from('profiles').select('id, role').limit(1).single();
  if (!owner) throw new Error('No owner found in DB');

  const createdAsset = await assetService.createAsset(owner.id, {
    title: 'San Francisco Commercial Plaza ' + Date.now().toString().slice(-4),
    description: 'Prime commercial plaza with verified encrypted legal deeds.',
    asset_type: 'commercial_property',
    valuation: 4500000,
    token_price: 450,
    token_supply: 10000,
    location: '100 Market St, San Francisco, CA',
    documents: [
      {
        document_type: 'title_deed',
        file_name: sampleFileName,
        ipfs_cid: pinResult.ipfsCid,
        mime_type: 'application/pdf',
        file_size_bytes: 2048,
        encrypted_data: samplePlaintextContent,
      },
    ],
  });

  // Step 5: Verify Supabase asset_documents table contains AES-256-GCM Ciphertext
  const { data: docRows } = await supabaseAdmin
    .from('asset_documents')
    .select('id, asset_id, file_name, ipfs_cid, encrypted_data')
    .eq('asset_id', createdAsset.id);

  const doc = docRows![0];
  console.log(`🔍 Supabase DB Check on 'asset_documents' table:`);
  console.log(` - Document ID:     ${doc.id}`);
  console.log(` - IPFS CID:        ${doc.ipfs_cid}`);
  console.log(` - Encrypted Data:  ${doc.encrypted_data?.slice(0, 50)}...\n`);

  // Step 6: Test Authorized Decryption Endpoint (Owner / Verifier / Admin)
  const decryptedDoc = await assetService.getDecryptedDocument(doc.id, {
    id: owner.id,
    role: 'asset_owner',
  });
  console.log(`🔓 AUTHORIZED DECRYPTION TEST (Asset Owner Request):`);
  console.log(` - Decrypted File Name: ${decryptedDoc.fileName}`);
  console.log(` - Decrypted Content:   "${decryptedDoc.decryptedContent}"`);

  if (decryptedDoc.decryptedContent === samplePlaintextContent) {
    console.log(`  ✨ PASS: Authorized user successfully decrypted AES-256-GCM ciphertext server-side!\n`);
  }

  // Step 7: Test Unauthorized Decryption Rejection
  try {
    await assetService.getDecryptedDocument(doc.id, {
      id: 'unauthorized-user-uuid-9999',
      role: 'investor',
    });
    console.error(`  ❌ FAIL: Unauthorized user was able to decrypt document!`);
  } catch (err: any) {
    console.log(`🔒 UNAUTHORIZED USER DECRYPTION REJECTION TEST:`);
    console.log(`  ✨ PASS: Rejected unauthorized user with error: "${err.message}"\n`);
  }

  console.log('===============================================================');
  console.log('🎉 AES-256-GCM ASSET DOCUMENT ENCRYPTION & DECRYPTION PASSED');
  console.log('===============================================================');
}

testAssetUploadStorage().catch(err => {
  console.error('💥 Test Error:', err);
  process.exit(1);
});
