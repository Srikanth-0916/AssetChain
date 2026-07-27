import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Conditionally import Razorpay only if key is set
let Razorpay: any = null;
let razorpayInstance: any = null;

async function getRazorpay() {
  if (!Razorpay && env.RAZORPAY_KEY_ID) {
    try {
      const mod = await import('razorpay');
      Razorpay = mod.default;
      razorpayInstance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    } catch {
      // Razorpay not available
    }
  }
  return razorpayInstance;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  mode: 'razorpay' | 'mock';
  keyId?: string;
}

export interface VerifyResult {
  verified: boolean;
  txSimulation: {
    tokensMinted: number;
    assetId: string;
    txHash: string;
    mintedAt: string;
  };
}

/**
 * Razorpay Payment Service — UPI → INR → USDC → Token Mint simulation.
 */
export class RazorpayService {
  /**
   * Create a payment order. Falls back to mock if keys not configured.
   */
  async createOrder(
    amountInUSD: number,
    assetId: string,
    tokenQuantity: number
  ): Promise<OrderResult> {
    const receipt = `ac_${assetId.slice(0, 8)}_${uuidv4().slice(0, 8)}`;
    // Convert USD to INR (simulated rate)
    const amountInINR = Math.round(amountInUSD * 83.5 * 100); // Razorpay uses paise

    const rz = await getRazorpay();

    if (rz && env.RAZORPAY_KEY_ID) {
      try {
        const order = await rz.orders.create({
          amount: amountInINR,
          currency: 'INR',
          receipt,
          notes: { asset_id: assetId, token_quantity: tokenQuantity.toString() },
        });
        return {
          orderId: order.id,
          amount: amountInINR,
          currency: 'INR',
          receipt,
          mode: 'razorpay',
          keyId: env.RAZORPAY_KEY_ID,
        };
      } catch (err) {
        console.warn('[RazorpayService] Order creation failed, using mock:', err);
      }
    }

    // Mock order
    return {
      orderId: `order_mock_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      amount: amountInINR,
      currency: 'INR',
      receipt,
      mode: 'mock',
      keyId: env.RAZORPAY_KEY_ID || 'mock_key',
    };
  }

  /**
   * Verify payment signature and simulate token mint.
   */
  async verifyAndMint(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    assetId: string,
    tokenQuantity: number
  ): Promise<VerifyResult> {
    let verified = false;

    if (env.RAZORPAY_KEY_SECRET && razorpayOrderId.startsWith('order_') && !razorpayOrderId.includes('mock')) {
      // Real signature verification
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      verified = expectedSignature === razorpaySignature;
    } else {
      // Mock mode — always verify
      verified = true;
    }

    // Simulate token mint on Polygon
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    return {
      verified,
      txSimulation: {
        tokensMinted: tokenQuantity,
        assetId,
        txHash,
        mintedAt: new Date().toISOString(),
      },
    };
  }
}

export const razorpayService = new RazorpayService();
