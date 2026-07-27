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

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: Date; userId: string }>();

/**
 * Wallet authentication service.
 * Handles MetaMask wallet linking via EIP-191 signed messages.
 */
export class WalletService {
  /**
   * Generate a nonce for wallet signature verification.
   */
  async generateNonce(walletAddress: string, userId: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if wallet is already linked to another account
    const { data: existing } = await supabaseAdmin
      .from('users')
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

    // Link wallet to user
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        wallet_address: normalizedAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to link wallet: ${error.message}`);
    }

    // Get updated user and generate new token with wallet
    const { data: user } = await supabaseAdmin
      .from('users')
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
}

export const walletService = new WalletService();
