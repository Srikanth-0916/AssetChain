import React, { useState, useEffect, useCallback } from 'react';
import { paymentApiService } from '../../services/platformServices';
import { HumanTxFlow } from '../trust/HumanTxFlow';
import { InvestmentConfirmationCard } from '../trust/InvestmentConfirmationCard';
import { ShieldCheck, Lock } from 'lucide-react';

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

export function PaymentModal({ assetId, assetTitle, tokenPrice, quantity, onSuccess, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('checkout');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTxStep, setCurrentTxStep] = useState(0);

  const totalUsd = tokenPrice * quantity;
  const totalInr = Math.round(totalUsd * 83.5);

  useEffect(() => {
    loadRazorpayScript().then(setIsScriptLoaded);
  }, []);

  const handlePay = useCallback(async () => {
    setStep('processing');
    setCurrentTxStep(0);

    try {
      // Step 1: Creating ownership certificate
      const order = await paymentApiService.createOrder(totalUsd, assetId, quantity);
      setCurrentTxStep(1);

      if (order.mode === 'mock' || !window.Razorpay) {
        // Step 2: Securing investment
        await new Promise((r) => setTimeout(r, 1200));
        setCurrentTxStep(2);

        const verifyRes = await paymentApiService.verifyPayment({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          asset_id: assetId,
          token_quantity: quantity,
        });

        // Step 3: Recording ownership on blockchain
        await new Promise((r) => setTimeout(r, 1000));
        setCurrentTxStep(3);

        setTxHash(verifyRes.transactionHash);
        setStep('success');
        onSuccess(verifyRes.transactionHash);
        return;
      }

      // Live Razorpay options
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AssetChain',
        description: `${quantity} tokens of ${assetTitle}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            setCurrentTxStep(2);
            const verifyRes = await paymentApiService.verifyPayment({
              ...response,
              asset_id: assetId,
              token_quantity: quantity,
            });
            setCurrentTxStep(3);
            setTxHash(verifyRes.transactionHash);
            setStep('success');
            onSuccess(verifyRes.transactionHash);
          } catch (err: any) {
            setErrorMsg(err.message || 'Payment verification failed');
            setStep('error');
          }
        },
        modal: {
          ondismiss: () => setStep('checkout'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate payment');
      setStep('error');
    }
  }, [assetId, assetTitle, quantity, totalUsd, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Checkout step */}
        {step === 'checkout' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Investment Checkout</h2>
              <p className="text-xs text-slate-400">{assetTitle}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens</span>
                <span className="text-white font-semibold">{quantity} ACT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price per Token</span>
                <span className="text-white">${tokenPrice}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-emerald-400">${totalUsd.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Payments are processed securely via Razorpay and verified on Polygon Amoy.</span>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button onClick={handlePay} className="btn-primary flex-1 text-xs">
                Pay ${totalUsd.toLocaleString()}
              </button>
            </div>
          </div>
        )}

        {/* Processing step with Humanized Sequential Flow */}
        {step === 'processing' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Securing Your Investment</h3>
              <p className="text-xs text-slate-400">Please confirm payment details in Razorpay modal</p>
            </div>

            <HumanTxFlow
              currentStepIndex={currentTxStep}
              txHash="Processing..."
              contractAddress="0x1111...1111"
              blockNumber={14920812}
            />
          </div>
        )}

        {/* Success step with Human Framing Confirmation Card */}
        {step === 'success' && (
          <div className="space-y-4 py-2">
            <InvestmentConfirmationCard
              assetTitle={assetTitle}
              investmentAmount={totalUsd}
              tokensPurchased={quantity}
              tokenSupply={10000}
              nextDistributionDate="15 Aug 2026"
              spvVerified={true}
            />

            <HumanTxFlow
              currentStepIndex={3}
              txHash={txHash || '0x3f9e...82d1'}
              contractAddress="0x1111...1111"
              blockNumber={14920812}
            />

            <button onClick={onClose} className="btn-primary w-full text-xs">
              Done & View Portfolio
            </button>
          </div>
        )}

        {/* Error step */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              ✕
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-bold text-sm">Payment Failed</p>
              <p className="text-red-300">{errorMsg}</p>
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
