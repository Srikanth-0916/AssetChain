import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../src/config/database';
import { authService } from '../src/services/auth.service';
import { userService } from '../src/services/user.service';
import { portfolioService } from '../src/services/portfolio.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { auditService } from '../src/modules/audit/audit.service';
import { assetService } from '../src/services/asset.service';

async function runRuntimeVerification() {
  console.log('===============================================================');
  console.log('🚀 RUNTIME MULTI-USER DATA ISOLATION & EMPTY STATE VERIFICATION');
  console.log('===============================================================\n');

  try {
    // ── STEP 1: Register Profiles in Supabase ──
    console.log('1️⃣ Registering User A, User B, and Asset Owner in Supabase...');
    const randomSuffix = Date.now().toString().slice(-5);

    const userA_res = await authService.register({
      full_name: 'User A (Investor)',
      email: `usera_${randomSuffix}@test.com`,
      password: 'Password123!',
      role: 'investor',
    });
    const userA_id = userA_res.user.id;

    const userB_res = await authService.register({
      full_name: 'User B (Brand New)',
      email: `newuser_${randomSuffix}@test.com`,
      password: 'Password123!',
      role: 'investor',
    });
    const userB_id = userB_res.user.id;

    const owner_res = await authService.register({
      full_name: 'Asset Owner (Originator)',
      email: `owner_${randomSuffix}@test.com`,
      password: 'Password123!',
      role: 'asset_owner',
    });
    const assetOwner_id = owner_res.user.id;

    console.log(`  ✅ User A Profile Created in Supabase (id: ${userA_id}, role: investor)`);
    console.log(`  ✅ User B Profile Created in Supabase (id: ${userB_id}, role: investor)`);
    console.log(`  ✅ Owner Profile Created in Supabase  (id: ${assetOwner_id}, role: asset_owner)\n`);

    // ── STEP 2: User A Creates Asset & Performs Investment ──
    console.log('2️⃣ User A / Owner Activity: Onboarding Asset & Adding Investment...');
    const asset = await assetService.createAsset(assetOwner_id, {
      title: 'Manhattan Commercial Tower ' + Date.now().toString().slice(-4),
      description: 'Luxury office tower in Midtown NYC',
      asset_type: 'commercial_property',
      valuation: 5000000,
      token_price: 250,
      token_supply: 20000,
      tokens_available: 19000,
      location: 'New York, USA',
      documents: [],
      contract_address: '0x' + uuidv4().replace(/-/g, ''),
    });
    console.log(`  ✅ Asset Created in Supabase (id: ${asset.id}, owner_id: ${asset.owner_id})`);

    // Insert investment for User A
    const { data: invA, error: invErr } = await supabaseAdmin.from('investments').insert({
      user_id: userA_id,
      asset_id: asset.id,
      tokens_owned: 400,
      investment_amount: 100000,
      average_buy_price: 250,
      current_value: 105000,
      total_roi_percent: 5.0,
      status: 'active',
    }).select().single();

    if (invErr) throw invErr;
    console.log(`  ✅ User A Investment Recorded in Supabase (id: ${invA.id}, user_id: ${invA.user_id})`);

    // Log Activity & Notification for User A
    await auditService.log({
      type: 'payment_verified',
      actorId: userA_id,
      actorRole: 'investor',
      description: 'You purchased 400 tokens of Manhattan Commercial Tower',
      metadata: { amount: 100000, tokens: 400 },
      severity: 'info',
    });

    await notificationService.notify(
      userA_id,
      'purchase_confirmed',
      'Investment Confirmed',
      'You purchased 400 tokens of Manhattan Commercial Tower',
      { amount: 100000, tokens: 400 }
    );
    console.log(`  ✅ User A Activity & Notification Logged in Supabase\n`);

    // ── STEP 3: Brand-New User (User B) Verification ──
    console.log('3️⃣ VERIFYING BRAND-NEW USER (User B) EMPTY DASHBOARD & DATA ISOLATION...');
    const userB_portfolio = await portfolioService.getPortfolio(userB_id);
    const userB_notifications = await notificationService.getNotifications(userB_id);
    const { data: userB_activities } = await supabaseAdmin.from('activity_logs').select('*').eq('user_id', userB_id);

    console.log(`  📊 User B Portfolio Valuation: $${userB_portfolio.summary.current_value.toFixed(2)} (Expected: $0.00)`);
    console.log(`  📊 User B Total Invested:      $${userB_portfolio.summary.total_invested.toFixed(2)} (Expected: $0.00)`);
    console.log(`  📊 User B Holdings Count:      ${userB_portfolio.holdings.length} (Expected: 0)`);
    console.log(`  📊 User B Notifications Count: ${userB_notifications.length} (Expected: 0)`);
    console.log(`  📊 User B Activity Logs Count: ${userB_activities?.length || 0} (Expected: 0)`);

    const userB_clean = 
      userB_portfolio.summary.current_value === 0 &&
      userB_portfolio.summary.total_invested === 0 &&
      userB_portfolio.holdings.length === 0 &&
      userB_notifications.length === 0 &&
      (userB_activities?.length || 0) === 0;

    if (!userB_clean) {
      console.error('❌ CRITICAL FAIL: User B sees mock or cross-tenant data!');
      process.exit(1);
    } else {
      console.log('  ✨ PASS: User B sees a completely empty dashboard ($0.00 / 0 holdings / 0 notifications / 0 activity).\n');
    }

    // ── STEP 4: Supabase Row & Ownership Verification ──
    console.log('4️⃣ VERIFYING SUPABASE ROW OWNERSHIP & DIRECTORY ISOLATION...');
    const { data: dbInvestmentsA } = await supabaseAdmin.from('investments').select('*').eq('user_id', userA_id);
    const { data: dbInvestmentsB } = await supabaseAdmin.from('investments').select('*').eq('user_id', userB_id);

    console.log(`  🔍 Supabase 'investments' rows where user_id = User A (${userA_id}): ${dbInvestmentsA?.length} row(s)`);
    console.log(`  🔍 Supabase 'investments' rows where user_id = User B (${userB_id}): ${dbInvestmentsB?.length} row(s)`);

    if (dbInvestmentsA?.length === 1 && dbInvestmentsB?.length === 0) {
      console.log('  ✨ PASS: Supabase database correctly scopes investments to individual user_id foreign keys.\n');
    } else {
      console.error('❌ FAIL: Supabase row ownership mismatch!');
      process.exit(1);
    }

    // ── STEP 5: User A Data Restoration & Persistence ──
    console.log('5️⃣ VERIFYING USER A DATA RESTORATION & PERSISTENCE...');
    const userA_portfolio = await portfolioService.getPortfolio(userA_id);
    const userA_notifications = await notificationService.getNotifications(userA_id);

    console.log(`  📊 User A Restored Portfolio Value: $${userA_portfolio.summary.current_value.toLocaleString()}`);
    console.log(`  📊 User A Restored Holdings Count:  ${userA_portfolio.holdings.length}`);
    console.log(`  📊 User A Restored Notifications:   ${userA_notifications.length}`);

    if (userA_portfolio.summary.current_value === 105000 && userA_portfolio.holdings.length === 1) {
      console.log('  ✨ PASS: User A data is fully restored intact from Supabase after multi-user sessions!\n');
    } else {
      console.error('❌ FAIL: User A data was lost or corrupted!');
      process.exit(1);
    }

    console.log('===============================================================');
    console.log('🎉 VERIFICATION COMPLETE: ALL 5 RUNTIME ISOLATION CHECKS PASSED');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('💥 Error during verification run:', err);
    process.exit(1);
  }
}

runRuntimeVerification();
