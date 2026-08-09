import http from 'http';
import { authService } from '../src/services/auth.service';
import { assetService } from '../src/services/asset.service';
import { portfolioService } from '../src/services/portfolio.service';
import { nomineeService } from '../src/modules/nominee/nominee.service';
import { razorpayService } from '../src/modules/payment/razorpay.service';
import { aiService } from '../src/modules/ai/ai.service';
import { assetComparisonService } from '../src/modules/analytics/asset.comparison.service';

async function makeRequest(path: string, method = 'GET', body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let responseText = '';
        res.on('data', (chunk) => (responseText += chunk));
        res.on('end', () => {
          try {
            const data = responseText ? JSON.parse(responseText) : {};
            resolve({ status: res.statusCode || 500, data });
          } catch {
            resolve({ status: res.statusCode || 500, data: responseText });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runMasterBackendAudit() {
  console.log('🚀 Starting Complete Backend Pipeline Audit...\n');
  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  // 1. Health Check Endpoint
  try {
    const res = await makeRequest('/api/v1/health');
    if (res.status === 200) {
      results.push({ test: 'API Server Health Check (/api/v1/health)', status: 'PASSED' });
    } else {
      results.push({ test: 'API Server Health Check (/api/v1/health)', status: 'FAILED', details: `HTTP ${res.status}` });
    }
  } catch (err: any) {
    results.push({ test: 'API Server Health Check (/api/v1/health)', status: 'FAILED', details: err.message });
  }

  // 2. Analytics Overview Endpoint (Public)
  try {
    const res = await makeRequest('/api/v1/analytics/overview');
    if (res.status === 200) {
      results.push({ test: 'Analytics Overview (/api/v1/analytics/overview)', status: 'PASSED' });
    } else {
      results.push({ test: 'Analytics Overview (/api/v1/analytics/overview)', status: 'FAILED', details: `HTTP ${res.status}` });
    }
  } catch (err: any) {
    results.push({ test: 'Analytics Overview (/api/v1/analytics/overview)', status: 'FAILED', details: err.message });
  }

  // 3. User Registration & Auth Pipeline
  let investorEmail = `audit_user_${Date.now()}@assetchain.io`;
  let userId = '';
  try {
    const regResult = await authService.register({
      full_name: 'Pipeline Auditor',
      email: investorEmail,
      password: 'AuditPassword123!',
      role: 'investor',
    });
    userId = regResult.user.id;
    const loginResult = await authService.login(investorEmail, 'AuditPassword123!');
    if (loginResult.token) {
      results.push({ test: 'Authentication & JWT Pipeline (Register + Login)', status: 'PASSED' });
    } else {
      results.push({ test: 'Authentication & JWT Pipeline (Register + Login)', status: 'FAILED', details: 'No token returned' });
    }
  } catch (err: any) {
    results.push({ test: 'Authentication & JWT Pipeline (Register + Login)', status: 'FAILED', details: err.message });
  }

  // 4. Asset Management & Retrieval Pipeline
  try {
    const marketplaceAssets = await assetService.getMarketplaceAssets({ status: 'tokenized' });
    if (marketplaceAssets && Array.isArray(marketplaceAssets.assets)) {
      results.push({ test: 'Asset Management Pipeline (Marketplace Assets Query)', status: 'PASSED' });
    } else {
      results.push({ test: 'Asset Management Pipeline (Marketplace Assets Query)', status: 'FAILED' });
    }
  } catch (err: any) {
    results.push({ test: 'Asset Management Pipeline (Marketplace Assets Query)', status: 'FAILED', details: err.message });
  }

  // 5. Portfolio Pipeline
  try {
    const portfolio = await portfolioService.getPortfolio(userId);
    if (portfolio && portfolio.summary) {
      results.push({ test: 'Portfolio Engine Pipeline (getPortfolio)', status: 'PASSED' });
    } else {
      results.push({ test: 'Portfolio Engine Pipeline (getPortfolio)', status: 'FAILED' });
    }
  } catch (err: any) {
    results.push({ test: 'Portfolio Engine Pipeline (getPortfolio)', status: 'FAILED', details: err.message });
  }

  // 6. Razorpay Payment & Token Mint Pipeline
  try {
    const order = await razorpayService.createOrder(100, 'asset-demo-uuid-001', 5);
    const verify = await razorpayService.verifyAndMint(order.orderId, 'pay_audit_123', 'sig_audit', 'asset-demo-uuid-001', 5);
    if (verify.verified && verify.txSimulation?.txHash) {
      results.push({ test: 'Payment Gateway Pipeline (Razorpay Order + Token Mint Simulation)', status: 'PASSED' });
    } else {
      results.push({ test: 'Payment Gateway Pipeline (Razorpay Order + Token Mint Simulation)', status: 'FAILED' });
    }
  } catch (err: any) {
    results.push({ test: 'Payment Gateway Pipeline (Razorpay Order + Token Mint Simulation)', status: 'FAILED', details: err.message });
  }

  // 7. Nominee & Heir Estate Pipeline
  try {
    const nominee = await nomineeService.setNominee(userId, {
      fullName: 'Nominee Heir Test',
      relationship: 'Child',
      email: 'heir@example.com',
      nomineeWalletAddress: '0x1111111111111111111111111111111111111111',
      allocationPercentage: 100,
    });
    const fetched = await nomineeService.getNominee(userId);
    if (fetched && fetched.fullName === 'Nominee Heir Test') {
      results.push({ test: 'Nominee & Heir Pipeline (setNominee + getNominee)', status: 'PASSED' });
    } else {
      results.push({ test: 'Nominee & Heir Pipeline (setNominee + getNominee)', status: 'FAILED' });
    }
  } catch (err: any) {
    results.push({ test: 'Nominee & Heir Pipeline (setNominee + getNominee)', status: 'FAILED', details: err.message });
  }

  // 8. AI Copilot & Risk Engine Pipeline
  try {
    const advice = await aiService.getInvestmentAdvice(userId, 50000, 'medium');
    const comparison = await assetComparisonService.compareAssets(['ast-com-01', 'ast-sol-02']);
    if (advice && advice.summary && comparison && Array.isArray(comparison.metrics)) {
      results.push({ test: 'AI Copilot & Risk Engine Pipeline (Gemini Advice + Asset Comparison)', status: 'PASSED' });
    } else {
      results.push({ test: 'AI Copilot & Risk Engine Pipeline (Gemini Advice + Asset Comparison)', status: 'FAILED' });
    }
  } catch (err: any) {
    results.push({ test: 'AI Copilot & Risk Engine Pipeline (Gemini Advice + Asset Comparison)', status: 'FAILED', details: err.message });
  }

  // Summary Output
  console.log('--- BACKEND PIPELINE AUDIT REPORT ---');
  let passedCount = 0;
  for (const r of results) {
    if (r.status === 'PASSED') {
      console.log(`✅ [PASSED] ${r.test}`);
      passedCount++;
    } else {
      console.log(`❌ [FAILED] ${r.test} - Details: ${r.details || 'Unknown error'}`);
    }
  }
  console.log(`\nFinal Audit Score: ${passedCount} / ${results.length} Pipeline Subsystems Operational.`);
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runMasterBackendAudit().catch((err) => {
  console.error('Fatal Pipeline Audit Error:', err);
  process.exit(1);
});
