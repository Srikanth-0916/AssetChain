import React from 'react';
import {
  Shield, ExternalLink, CheckCircle2, Clock, Loader2, AlertCircle,
  FileCode, Layers, Cpu, Check, Copy
} from 'lucide-react';

export interface SmartContractTrackerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  contractName?: string;
  contractAddress?: string;
  functionName?: string;
  txHash?: string | null;
  networkName?: string;
  chainId?: number;
  walletAddress?: string | null;
  estimatedGas?: string;
  status: 'pending' | 'broadcasting' | 'mining' | 'confirmed' | 'completed' | 'failed';
  explorerUrl?: string;
}

export function SmartContractTrackerModal({
  isOpen,
  onClose,
  contractName = 'FractionalMarketplace',
  contractAddress = '0x1111111111111111111111111111111111111111',
  functionName = 'buyFractionalTokens(uint256 assetId, uint256 tokenAmount)',
  txHash = '0x605F29FD65B97BD7A4918FDD2169A83B8487A3E21',
  networkName = 'Polygon Amoy Testnet',
  chainId = 80002,
  walletAddress = null,
  estimatedGas = '0.0018 POL',
  status = 'confirmed',
  explorerUrl,
}: SmartContractTrackerModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const actualExplorerUrl =
    explorerUrl || (txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : 'https://amoy.polygonscan.com/');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STAGES = [
    { key: 'pending', label: '1. Constructed' },
    { key: 'broadcasting', label: '2. Broadcast' },
    { key: 'mining', label: '3. Mempool / Mining' },
    { key: 'confirmed', label: '4. Confirmed' },
    { key: 'completed', label: '5. Settled' },
  ];

  const getStageIndex = (st: string) => {
    switch (st) {
      case 'pending': return 0;
      case 'broadcasting': return 1;
      case 'mining': return 2;
      case 'confirmed': return 3;
      case 'completed': return 4;
      default: return 4;
    }
  };

  const currentIdx = getStageIndex(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-card border border-indigo-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <FileCode className="w-3 h-3 text-indigo-400" /> On-Chain Contract Execution
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                EIP-1559 Protected
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {contractName}
            </h3>
            <p className="text-xs text-slate-400 font-mono">{functionName}</p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>

        {/* Progress Pipeline */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Transaction Execution Stages
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={s.key}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${
                    isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-500/10 animate-pulse'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div>{s.label}</div>
                  <div className="mt-1 flex justify-center">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Network Authority</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> {networkName} ({chainId})
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Est. Network Fee</span>
            <span className="font-semibold text-emerald-400 font-mono block">{estimatedGas}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 col-span-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Smart Contract EOA</span>
            <span className="font-mono text-slate-300 text-[11px] break-all block">{contractAddress}</span>
          </div>

          {txHash && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-indigo-500/20 space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 text-[10px] uppercase font-bold">Polygon Block Explorer Tx Hash</span>
                <button
                  onClick={() => handleCopy(txHash)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Hash'}
                </button>
              </div>
              <div className="font-mono text-emerald-300 text-xs font-bold break-all">{txHash}</div>
            </div>
          )}
        </div>

        {/* Action Link to Explorer */}
        <div className="pt-2 flex items-center justify-between">
          <a
            href={actualExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <span>Verify Live On PolygonScan Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
}
