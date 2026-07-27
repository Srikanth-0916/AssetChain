import React, { useState, useEffect, useCallback } from 'react';
import { paymentApiService } from '../../services/platformServices';

// ─── Razorpay global type ──────────────────────────────────────────────────────
declare global {
  interface Window { Razorpay: any; }
}

export interface PaymentModalProps {
  assetId: string;
  assetTitle: string;
  tokenPrice: number;
  quantity: number;
  onSuccess: (txHash: string) => void;
  onClose: () => void;
}

type PaymentStep = 'checkout' | 'processing' | 'success' | 'error';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * PaymentModal — Razorpay checkout with UPI / Card / Net Banking / QR.
 * Works in test mode without real keys (mock flow).
 */
export function PaymentModal({ assetId, assetTitle, tokenPrice, quantity, onSuccess, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('checkout');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const totalUsd = tokenPrice * quantity;
  const totalInr = Math.round(totalUsd * 83.5);

  useEffect(() => {
    loadRazorpayScript().then(setIsScriptLoaded);
  }, []);

  const handlePay = useCallback(async () => {
    setStep('processing');
    try {
      // 1. Create order
      const order = await paymentApiService.createOrder(totalUsd, assetId, quantity);

      if (order.mode === 'mock' || !window.Razorpay) {
        // Mock payment flow — no Razorpay keys
        await new Promise((r) => setTimeout(r, 1500));
        const verifyRes = await paymentApiService.verifyPayment({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          asset_id: assetId,
          token_quantity: quantity,
        });
        setTxHash(verifyRes.txSimulation?.txHash || '0x' + Math.random().toString(16).slice(2));
        setStep('success');
        onSuccess(verifyRes.txSimulation?.txHash);
        return;
      }

      // 2. Real Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'TrustChain AI',
        description: `${quantity} tokens — ${assetTitle}`,
        order_id: order.orderId,
        theme: { color: '#6366f1' },
        prefill: { name: 'Investor', email: 'investor@trustchain.ai' },
        handler: async (response: any) => {
          setStep('processing');
          try {
            const verifyRes = await paymentApiService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              asset_id: assetId,
              token_quantity: quantity,
            });
            setTxHash(verifyRes.txSimulation?.txHash || response.razorpay_payment_id);
            setStep('success');
            onSuccess(verifyRes.txSimulation?.txHash);
          } catch {
            setStep('error');
            setErrorMsg('Payment verified but token mint failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            if (step === 'processing') return;
            onClose();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res: any) => {
        setStep('error');
        setErrorMsg(res.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      setStep('error');
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Order creation failed.');
    }
  }, [assetId, assetTitle, totalUsd, quantity, step, onClose, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}
    >
      <div className="glass-card border border-indigo-500/20 w-full max-w-md p-8 space-y-6 shadow-2xl shadow-indigo-500/10 animate-fade-in">

        {/* Checkout step */}
        {step === 'checkout' && (
          <>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Purchase Tokens</h2>
              <p className="text-xs text-slate-400">Secure payment via Razorpay · UPI, Card, Net Banking, QR</p>
            </div>

            {/* Order summary */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Asset</span>
                <span className="text-white font-semibold truncate max-w-[180px]">{assetTitle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Quantity</span>
                <span className="text-white font-semibold">{quantity} tokens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Price per token</span>
                <span className="text-white">${tokenPrice}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between">
                <span className="text-slate-300 font-semibold">Total</span>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">${totalUsd.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">≈ ₹{totalInr.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-4 gap-2">
              {['UPI', 'Card', 'Net Banking', 'QR'].map((m) => (
                <div key={m} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-[10px] text-slate-400">
                  {m}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={handlePay}
                disabled={!isScriptLoaded && false}
                className="btn-primary flex-1 text-sm"
              >
                Pay {totalUsd > 0 ? `$${totalUsd.toLocaleString()}` : ''}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              {window.Razorpay ? '🔒 Secured by Razorpay' : '🔒 Demo mode — no real payment'} · Tokens minted on Polygon Amoy
            </p>
          </>
        )}

        {/* Processing step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold">Processing Payment</p>
              <p className="text-slate-400 text-sm mt-1">Verifying transaction and minting tokens...</p>
            </div>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-bold text-lg">Payment Successful!</p>
              <p className="text-emerald-400 text-sm">{quantity} tokens minted to your wallet</p>
            </div>

            {/* Receipt */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Asset</span>
                <span className="text-white font-semibold">{assetTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens Minted</span>
                <span className="text-emerald-400 font-bold">{quantity} ACT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-white">${totalUsd.toLocaleString()}</span>
              </div>
              {txHash && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Tx Hash</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 font-mono text-[10px] hover:underline"
                  >
                    {txHash.slice(0, 16)}...
                  </a>
                </div>
              )}
            </div>

            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        )}

        {/* Error step */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-bold">Payment Failed</p>
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => setStep('checkout')} className="btn-primary flex-1">Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
