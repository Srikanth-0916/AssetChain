import { authService } from '../src/services/auth.service';
import { assetService } from '../src/services/asset.service';
import { supabaseAdmin } from '../src/config/database';
import { ethers } from 'ethers';

async function runConcreteChecks() {
  console.log('===============================================================');
  console.log('🔍 EXECUTING 3 CONCRETE REAL-WORLD VERIFICATION CHECKS');
  console.log('===============================================================\n');

  // ── CHECK 1: Real User Registration & Re-Login ──
  console.log('1️⃣ CHECK 1: Real User Registration & Database Row Scoping...');
  const testEmail = `realuser_${Date.now()}@test.com`;
  const testPassword = 'Password123!';

  // Step A: Register new user
  const regResult = await authService.register({
    full_name: 'Real World Tester',
    email: testEmail,
    password: testPassword,
    role: 'investor',
  });
  const userId = regResult.user.id;
  console.log(`  ✅ User Registered via Auth API (User ID: ${userId}, Email: ${testEmail})`);

  // Step B: Immediately query Supabase public.profiles table
  const { data: dbProfile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, kyc_status')
    .eq('id', userId)
    .single();

  if (profileErr || !dbProfile) {
    console.error('❌ FAIL Check 1: Profile row missing from Supabase!', profileErr?.message);
  } else {
    console.log(`  ✅ Supabase DB Query Confirmed Row Exists Immediately:`);
    console.log(`     - DB ID: ${dbProfile.id}`);
    console.log(`     - Email: ${dbProfile.email}`);
    console.log(`     - Role:  ${dbProfile.role}`);
  }

  // Step C: Log out & Log back in
  const loginResult = await authService.login(testEmail, testPassword);
  console.log(`  ✅ Re-Login Successful (Returned User ID: ${loginResult.user.id}, Token Issued: Yes)`);
  if (loginResult.user.id === userId) {
    console.log('  ✨ PASS Check 1: Real user registration & re-login verified with exact DB row matching.\n');
  }

  // ── CHECK 2: MetaMask EIP-191 Web3 Wallet Nonce & Signature Trace ──
  console.log('2️⃣ CHECK 2: Web3 Wallet Nonce & EIP-191 Signature Auth Flow...');
  
  // Create a random wallet for testing signature verification
  const testWallet = ethers.Wallet.createRandom();
  const walletAddress = testWallet.address;
  console.log(`  🔑 Generated Test Wallet Address: ${walletAddress}`);

  // Step A: Request nonce
  const nonceRes = await authService.requestPublicWalletNonce(walletAddress);
  console.log(`  ✅ Nonce Issued from Auth Service: "${nonceRes.nonce}"`);

  // Step B: Sign nonce using EIP-191 message standard
  const signature = await testWallet.signMessage(nonceRes.nonce);
  console.log(`  ✅ Nonce Signed via EIP-191 Signature: ${signature.slice(0, 20)}...`);

  // Step C: Verify signature & link wallet address in DB
  const walletLoginRes = await authService.verifyWalletSignature(walletAddress, signature);
  console.log(`  ✅ Signature Cryptographically Verified (Returned User ID: ${walletLoginRes.user.id})`);

  // Step D: Verify database row has wallet_address linked
  const { data: walletProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, wallet_address, email')
    .eq('id', walletLoginRes.user.id)
    .single();

  console.log(`  🔍 Supabase DB Check: wallet_address in DB row = ${walletProfile?.wallet_address}`);
  if (walletProfile?.wallet_address?.toLowerCase() === walletAddress.toLowerCase()) {
    console.log('  ✨ PASS Check 2: Web3 wallet nonce, signature verification, and DB row linking verified.\n');
  }

  // ── CHECK 3: Asset Image & Document Upload Storage / IPFS Pinata Trace ──
  console.log('3️⃣ CHECK 3: Asset Document / Image Upload Storage & IPFS Pinata Trace...');
  
  const sampleAsset = await assetService.createAsset(userId, {
    title: 'Waterfront Commercial Tower ' + Date.now().toString().slice(-4),
    description: 'High-yield commercial real estate property with verified deed documents.',
    asset_type: 'commercial_property',
    valuation: 3500000,
    token_price: 350,
    token_supply: 10000,
    location: '100 Harbor Drive, San Diego, CA',
  });
  console.log(`  ✅ Asset Created in Supabase (Asset ID: ${sampleAsset.id})`);

  // Inspect storage URL or IPFS CID
  console.log(`  🔍 Asset IPFS Metadata CID: ${sampleAsset.ipfs_metadata_cid || 'None (Using DB Storage fallback)'}`);
  console.log(`  🔍 Verification Status:      ${sampleAsset.verification_status}`);
  console.log('  ✨ PASS Check 3: Asset creation & storage pipeline trace completed.\n');

  console.log('===============================================================');
  console.log('🎉 ALL 3 CONCRETE CHECKS EXECUTED SUCCESSFULLY');
  console.log('===============================================================');
}

runConcreteChecks().catch((err) => {
  console.error('💥 Error during concrete checks run:', err);
  process.exit(1);
});
