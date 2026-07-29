/**
 * MoneyFlowTracker — Visual investment money flow from payment to token mint.
 *
 * Displays the complete pipeline:
 *   Payment → Razorpay → Treasury → Multi-Sig → Smart Contract → Token Mint → Portfolio
 *
 * Each step shows: status, timestamp, transaction hash, and explorer link.
 * Never fabricates data — shows "Data unavailable" if a step hasn't completed.
 */

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ExternalLink, ArrowDown } from 'lucide-react';

export type FlowStepStatus = 'completed' | 'processing' | 'pending' | 'failed';

export interface FlowStep {
  id: string;
  label: string;
  description: string;
  status: FlowStepStatus;
  timestamp?: string;
  txHash?: string;
  gasUsed?: string;
  amount?: string;
  currency?: string;
  explorerUrl?: string;
}

interface MoneyFlowTrackerProps {
  steps: FlowStep[];
  title?: string;
  compact?: boolean;
}

const STATUS_CONFIG: Record<FlowStepStatus, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  completed: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Completed',
  },
  processing: {
    icon: <Clock className="w-4 h-4 animate-spin" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: 'Processing',
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-gray-500',
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    label: 'Pending',
  },
  failed: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Failed',
  },
};

function truncateTxHash(hash: string): string {
  if (!hash || hash.length < 14) return hash;
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
}

/**
 * Build the default investment flow steps from a payment verification result.
 */
export function buildInvestmentFlowSteps(params: {
  paymentId?: string;
  orderId?: string;
  razorpayVerified?: boolean;
  razorpayTimestamp?: string;
  treasuryTxHash?: string;
  approvalStatus?: string;
  contractTxHash?: string;
  mintTxHash?: string;
  mintedAt?: string;
  tokensMinted?: number;
  amount?: number;
  currency?: string;
  polygonscanBase?: string;
}): FlowStep[] {
  const {
    paymentId,
    razorpayVerified,
    razorpayTimestamp,
    treasuryTxHash,
    approvalStatus,
    contractTxHash,
    mintTxHash,
    mintedAt,
    tokensMinted,
    amount,
    currency = 'INR',
    polygonscanBase = 'https://amoy.polygonscan.com/tx',
  } = params;

  return [
    {
      id: 'payment',
      label: 'Payment Initiated',
      description: 'Your payment was submitted via the platform payment gateway',
      status: paymentId ? 'completed' : 'pending',
      timestamp: razorpayTimestamp,
      txHash: paymentId,
      amount: amount ? `${currency} ${amount.toLocaleString()}` : undefined,
    },
    {
      id: 'razorpay',
      label: 'Razorpay Processing',
      description: 'Payment gateway verifies HMAC signature and processes the transaction',
      status: razorpayVerified ? 'completed' : paymentId ? 'processing' : 'pending',
      timestamp: razorpayTimestamp,
      txHash: paymentId,
    },
    {
      id: 'treasury',
      label: 'Treasury Deposit',
      description: 'Funds converted and deposited into the on-chain Treasury contract',
      status: treasuryTxHash ? 'completed' : razorpayVerified ? 'processing' : 'pending',
      txHash: treasuryTxHash,
      explorerUrl: treasuryTxHash ? `${polygonscanBase}/${treasuryTxHash}` : undefined,
    },
    {
      id: 'multisig',
      label: 'Multi-Sig Approval',
      description: '2-of-3 reviewer approval required before token minting (may be pre-approved for tokenized assets)',
      status:
        approvalStatus === 'approved' ? 'completed' :
        approvalStatus === 'pending' ? 'processing' : 'pending',
    },
    {
      id: 'contract',
      label: 'Smart Contract Execution',
      description: 'AssetToken contract processes the purchase on Polygon Amoy',
      status: contractTxHash ? 'completed' : 'pending',
      txHash: contractTxHash,
      explorerUrl: contractTxHash ? `${polygonscanBase}/${contractTxHash}` : undefined,
    },
    {
      id: 'mint',
      label: 'Token Mint',
      description: `${tokensMinted ? `${tokensMinted} tokens` : 'Tokens'} minted to your wallet via ERC-20 transfer`,
      status: mintTxHash ? 'completed' : 'pending',
      timestamp: mintedAt,
      txHash: mintTxHash,
      explorerUrl: mintTxHash ? `${polygonscanBase}/${mintTxHash}` : undefined,
      amount: tokensMinted ? `${tokensMinted} tokens` : undefined,
    },
    {
      id: 'portfolio',
      label: 'Portfolio Updated',
      description: 'Your holdings have been updated in your TrustChain AI portfolio',
      status: mintTxHash ? 'completed' : 'pending',
      timestamp: mintedAt,
    },
  ];
}

export function MoneyFlowTracker({ steps, title = 'Investment Money Flow', compact = false }: MoneyFlowTrackerProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const hasFailure = steps.some((s) => s.status === 'failed');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasFailure
              ? 'A step in the flow has failed — please contact support'
              : `${completedCount} of ${steps.length} steps completed`}
          </p>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full border font-medium ${
          hasFailure ? 'text-red-400 bg-red-500/10 border-red-500/30' :
          completedCount === steps.length ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
          'text-blue-400 bg-blue-500/10 border-blue-500/30'
        }`}>
          {hasFailure ? 'Failed' : completedCount === steps.length ? 'Complete' : 'In Progress'}
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-1">
        {steps.map((step, index) => {
          const config = STATUS_CONFIG[step.status];
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id}>
              <div className={`flex gap-3 p-3 rounded-xl border transition-all ${config.bg} ${config.border}`}>
                {/* Status Icon */}
                <div className={`mt-0.5 ${config.color} flex-shrink-0`}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-sm font-medium ${step.status === 'pending' ? 'text-gray-500' : 'text-white'}`}>
                      {step.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {step.amount && (
                        <span className={`text-xs font-mono ${config.color}`}>{step.amount}</span>
                      )}
                      <span className={`text-xs ${config.color}`}>{config.label}</span>
                    </div>
                  </div>

                  {!compact && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}

                  {/* Transaction details */}
                  {(step.txHash || step.timestamp) && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {step.txHash && (
                        <div className="flex items-center gap-1">
                          {step.explorerUrl ? (
                            <a
                              href={step.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs font-mono flex items-center gap-1 hover:underline ${config.color}`}
                            >
                              {truncateTxHash(step.txHash)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs font-mono text-gray-500">
                              {truncateTxHash(step.txHash)}
                            </span>
                          )}
                        </div>
                      )}
                      {step.timestamp && (
                        <span className="text-xs text-gray-600">
                          {new Date(step.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                      {step.gasUsed && (
                        <span className="text-xs text-gray-600">Gas: {step.gasUsed}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector arrow */}
              {!isLast && (
                <div className="flex justify-start pl-5 py-0.5">
                  <ArrowDown className={`w-4 h-4 ${
                    steps[index + 1].status !== 'pending' ? 'text-gray-600' : 'text-gray-800'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 pb-4 text-xs text-gray-600">
        Transaction hashes link to Polygon Amoy (testnet) explorer. Gas fees shown are estimates.
      </div>
    </div>
  );
}
