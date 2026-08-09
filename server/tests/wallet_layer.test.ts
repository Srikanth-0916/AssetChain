import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { authService } from '../src/services/auth.service';
import { walletService } from '../src/services/wallet.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { auditService } from '../src/modules/audit/audit.service';

describe('Production-Grade Web3 Wallet Layer Test Suite', () => {
  // Generate random test wallet EOA
  const testWallet = ethers.Wallet.createRandom();
  const walletAddress = testWallet.address.toLowerCase();

  it('1. Public Nonce Generation with Expiration Timestamp', async () => {
    const nonceObj = await authService.requestPublicWalletNonce(walletAddress, 'MetaMask');

    expect(nonceObj).toBeDefined();
    expect(nonceObj.walletAddress).toBe(walletAddress);
    expect(nonceObj.nonce).toContain('Sign this message to authenticate with TrustChain AI:');
    expect(nonceObj.expiresAt).toBeGreaterThan(Date.now());
  });

  it('2. EIP-191 Cryptographic Signature Verification & Replay Protection', async () => {
    // 1. Generate nonce
    const nonceObj = await authService.requestPublicWalletNonce(walletAddress, 'MetaMask');

    // 2. Sign message using wallet private key (EIP-191)
    const signature = await testWallet.signMessage(nonceObj.nonce);

    // 3. Verify signature via authService
    const result = await authService.verifyWalletSignature(walletAddress, signature, 'MetaMask', 'investor');

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.wallet_address).toBe(walletAddress);

    // 4. Replay Attack Test: Attempting to reuse the exact same signature must fail
    await expect(
      authService.verifyWalletSignature(walletAddress, signature, 'MetaMask', 'investor')
    ).rejects.toThrow();
  }, 60000);

  it('3. Multi-Wallet Type Support (Coinbase, Rabby, Trust, Rainbow, WalletConnect v2)', async () => {
    const multiWallets = ['Coinbase Wallet', 'Rabby Wallet', 'Trust Wallet', 'Rainbow', 'WalletConnect v2'];

    for (const wType of multiWallets) {
      const wallet = ethers.Wallet.createRandom();
      const addr = wallet.address.toLowerCase();

      const nonceObj = await authService.requestPublicWalletNonce(addr, wType);
      const sig = await wallet.signMessage(nonceObj.nonce);
      const res = await authService.verifyWalletSignature(addr, sig, wType, 'investor');

      expect(res.user.wallet_address).toBe(addr);
    }
  }, 60000);

  it('4. On-Chain Compliance Sync to Polygon Amoy Contracts', async () => {
    const sampleContracts = ['0x1111111111111111111111111111111111111111'];
    const syncRes = await walletService.syncComplianceToChain(walletAddress, sampleContracts, 1, 840, 1);

    expect(syncRes).toBeDefined();
    expect(syncRes.synced).toBeDefined();
  });

  it('5. Web3 Wallet Event Notification & Audit Trail Recording', async () => {
    const notif = await notificationService.notify(
      'user-demo-uuid-001',
      'wallet_connected',
      'Web3 Wallet Connected',
      `Wallet ${walletAddress.slice(0, 10)}... connected to Polygon Amoy Testnet (Chain 80002).`,
      { walletAddress, walletType: 'MetaMask', chainId: 80002 }
    );

    expect(notif).toBeDefined();
    expect(notif.title).toBe('Web3 Wallet Connected');

    const logs = auditService.getLog(20);
    expect(logs.length).toBeGreaterThan(0);
  });
});
