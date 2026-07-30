import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { generateToken, JWTPayload } from '../middleware/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from '../utils/errors';
import { env } from '../config/env';
import { getResilientProvider } from '../config/blockchain';

import { authService } from './auth.service';

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: Date; userId: string }>();

/**
 * Wallet authentication service.
 * Handles MetaMask wallet linking via EIP-191 signed messages.
 * Phase 1.4: Added syncComplianceToChain() for auto KYC→whitelist sync.
 */
export class WalletService {
  /**
   * Generate a public nonce for wallet login/registration (no auth required).
   */
  async generatePublicNonce(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const message = `Sign this message to verify your wallet ownership for AssetChain.\n\nNonce: ${nonce}\nAddress: ${normalizedAddress}\nTimestamp: ${new Date().toISOString()}`;

    nonceStore.set(normalizedAddress, { nonce: message, expiresAt, userId: '' });

    return {
      nonce: message,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Log in or register using wallet off-chain signature (no gas fee).
   */
  async loginWithWallet(walletAddress: string, signature: string, role: 'investor' | 'asset_owner' = 'investor') {
    const normalizedAddress = walletAddress.toLowerCase();

    // Get stored nonce
    const storedNonce = nonceStore.get(normalizedAddress);
    if (!storedNonce) {
      throw new UnprocessableError('No verification request found. Please request a new nonce.');
    }

    // Check expiry
    if (storedNonce.expiresAt < new Date()) {
      nonceStore.delete(normalizedAddress);
      throw new UnprocessableError('Nonce has expired. Please request a new one.');
    }

    // Verify signature off-chain
    try {
      const recoveredAddress = ethers.verifyMessage(storedNonce.nonce, signature);
      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        throw new UnauthorizedError('Wallet signature verification failed');
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnprocessableError('Invalid signature format');
    }

    // Clean up nonce
    nonceStore.delete(normalizedAddress);

    // Login or auto-register user with wallet_address & user_id primary key
    return authService.loginOrCreateWithWallet(normalizedAddress, role);
  }

  /**
   * Generate a nonce for wallet signature verification (authenticated linking).
   */
  async generateNonce(walletAddress: string, userId: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if wallet is already linked to another account
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('wallet_address', normalizedAddress)
      .neq('id', userId)
      .single();

    if (existing) {
      throw new ConflictError('This wallet address is already linked to another account');
    }

    // Generate nonce
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    nonceStore.set(normalizedAddress, { nonce, expiresAt, userId });

    const message = `Sign this message to verify your wallet ownership for AssetChain.\n\nNonce: ${nonce}\nAddress: ${normalizedAddress}\nTimestamp: ${new Date().toISOString()}`;

    return {
      nonce: message,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Verify a wallet signature and link the wallet to the user's account.
   */
  async verifyWallet(walletAddress: string, signature: string, userId: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    // Get stored nonce
    const storedNonce = nonceStore.get(normalizedAddress);
    if (!storedNonce) {
      throw new UnprocessableError('No verification request found. Please request a new nonce.');
    }

    // Check expiry
    if (storedNonce.expiresAt < new Date()) {
      nonceStore.delete(normalizedAddress);
      throw new UnprocessableError('Nonce has expired. Please request a new one.');
    }

    // Verify the user making the request matches the nonce request
    if (storedNonce.userId !== userId) {
      throw new UnauthorizedError('Nonce was generated for a different user');
    }

    // Recover address from signature
    try {
      const recoveredAddress = ethers.verifyMessage(storedNonce.nonce, signature);

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        throw new UnauthorizedError('Wallet signature verification failed');
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnprocessableError('Invalid signature format');
    }

    // Clean up nonce
    nonceStore.delete(normalizedAddress);

    // Link wallet to user profile
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_address: normalizedAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to link wallet: ${error.message}`);
    }

    // Get updated profile and generate new token with wallet
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, wallet_address')
      .eq('id', userId)
      .single();

    if (!user) throw new NotFoundError('User');

    // Generate new JWT with wallet address
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.wallet_address,
    };
    const token = generateToken(tokenPayload);

    return {
      wallet_address: normalizedAddress,
      linked: true,
      token,
    };
  }

  /**
   * Phase 1.4 — Auto-sync KYC approval to on-chain compliance profile.
   *
   * Called after admin approves KYC for a user. Updates AssetToken.setComplianceProfile()
   * for every tokenized asset the user holds, closing the compliance gap where backend
   * KYC approval never propagated to the on-chain whitelist.
   *
   * @param walletAddress      - User's wallet address to whitelist
   * @param contractAddresses  - List of AssetToken contract addresses to update
   * @param kycStatusCode      - 1=Approved, 2=Revoked
   * @param jurisdictionCode   - ISO numeric code (e.g. 840=US, 784=UAE)
   * @param riskTierCode       - 1=Low, 2=Medium, 3=High
   */
  async syncComplianceToChain(
    walletAddress: string,
    contractAddresses: string[],
    kycStatusCode: number = 1,
    jurisdictionCode: number = 840,
    riskTierCode: number = 1
  ): Promise<{ synced: string[]; failed: string[]; skipped: string[] }> {
    const ZERO_KEY = '0x' + '0'.repeat(64);
    if (!env.DEPLOYER_PRIVATE_KEY || env.DEPLOYER_PRIVATE_KEY === ZERO_KEY) {
      console.warn('[WalletService] syncComplianceToChain: No valid DEPLOYER_PRIVATE_KEY — skipping on-chain sync');
      return { synced: [], failed: [], skipped: contractAddresses };
    }

    // Minimal AssetToken ABI for setComplianceProfile
    const ASSET_TOKEN_ABI = [
      'function setComplianceProfile(address account, uint8 kycStatus, uint16 jurisdictionCode, uint8 riskTier, bool transferPermission) external',
    ];

    const provider = getResilientProvider();
    const signer = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);

    const synced: string[] = [];
    const failed: string[] = [];

    for (const contractAddress of contractAddresses) {
      try {
        const contract = new ethers.Contract(contractAddress, ASSET_TOKEN_ABI, signer);
        const transferPermission = kycStatusCode === 1; // Only KYC-approved can transfer
        const tx = await contract.setComplianceProfile(
          walletAddress,
          kycStatusCode,
          jurisdictionCode,
          riskTierCode,
          transferPermission
        );
        await tx.wait(1); // Wait for 1 block confirmation
        console.log(`[WalletService] On-chain compliance synced: ${walletAddress} → ${contractAddress} (tx: ${tx.hash})`);
        synced.push(contractAddress);
      } catch (error) {
        console.error(`[WalletService] Failed to sync compliance for ${contractAddress}:`, (error as Error).message);
        failed.push(contractAddress);
      }
    }

    return { synced, failed, skipped: [] };
  }
}

export const walletService = new WalletService();
