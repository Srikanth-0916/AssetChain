import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "../../contexts/WalletContext";
import { InvestmentConfirmationCard } from "../trust/InvestmentConfirmationCard";
import { SmartContractTrackerModal } from "../explainability/SmartContractTrackerModal";
import {
  ShieldCheck,
  Wallet,
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  ArrowRight,
  Check,
  RefreshCcw,
} from "lucide-react";
import {
  web3InvestmentService,
  type InvestmentStage,
  type InvestmentResult,
  type OnProgressCallback,
} from "../../services/web3InvestmentService";
import {
  MARKETPLACE_ADDRESS,
  isContractConfigured,
  buildPolygonScanTxUrl,
} from "../../config/contracts";

export interface PaymentModalProps {
  assetId: string;
  assetTitle: string;
  tokenPrice: number;
  quantity: number;
  onSuccess: (txHash: string) => void;
  onClose: () => void;
}

type ModalStep = "checkout" | "processing" | "success" | "error";

/** Granular stepper stages matching user recommendation */
const STEPPER_STAGES: Array<{
  id: InvestmentStage;
  label: string;
  subtext: string;
}> = [
  {
    id: "preparing",
    label: "Preparing Transaction",
    subtext: "Validating asset availability & fees",
  },
  {
    id: "checking_network",
    label: "Checking Network & Balance",
    subtext: "Verifying Polygon Amoy & POL balance",
  },
  {
    id: "awaiting_metamask",
    label: "Waiting for MetaMask Approval",
    subtext: "Confirm transaction in MetaMask popup",
  },
  {
    id: "submitting",
    label: "Submitting to Polygon",
    subtext: "Broadcasting to Polygon Amoy nodes",
  },
  {
    id: "mining",
    label: "Waiting for Confirmation",
    subtext: "Mining block on Polygon Amoy testnet",
  },
  {
    id: "syncing_database",
    label: "Updating Portfolio",
    subtext: "Verifying receipt & updating balance",
  },
];

/** Map stage to stepper index (0..5) */
function stageToStepIndex(stage: InvestmentStage): number {
  switch (stage) {
    case "idle":
    case "preparing":
      return 0;
    case "checking_network":
    case "fetching_price":
      return 1;
    case "awaiting_metamask":
      return 2;
    case "submitting":
      return 3;
    case "mining":
      return 4;
    case "syncing_database":
    case "complete":
      return 5;
    case "error":
      return 0;
    default:
      return 0;
  }
}

export function PaymentModal({
  assetId,
  assetTitle,
  tokenPrice,
  quantity,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const { connect, address, isConnected, signer, isCorrectNetwork } =
    useWallet();

  const [step, setStep] = useState<ModalStep>("checkout");
  const [stage, setStage] = useState<InvestmentStage>("idle");
  const [stageMessage, setStageMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [investmentResult, setInvestmentResult] =
    useState<InvestmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [saleAvailability, setSaleAvailability] = useState<{
    available: boolean;
    message: string;
    pricePOL?: string;
  } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const totalInr = Math.round(tokenPrice * quantity * 83.5);
  const contractConfigured = isContractConfigured();

  const refreshSaleAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    setSaleAvailability(null);

    try {
      const result = await web3InvestmentService.checkPOLSaleAvailability(
        assetId,
      );
      setSaleAvailability(result);
    } catch (err: any) {
      setSaleAvailability({
        available: false,
        message: `Could not verify sale availability: ${err?.message || err}`,
      });
    } finally {
      setAvailabilityLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    refreshSaleAvailability();
  }, [assetId, refreshSaleAvailability]);

  const handleProgress: OnProgressCallback = useCallback(
    ({ stage: s, txHash: hash, message }) => {
      setStage(s);
      setStageMessage(message);
      if (hash) setTxHash(hash);
    },
    [],
  );

  const handleInvest = useCallback(async () => {
    setStep("processing");
    setStage("preparing");
    setErrorMsg("");
    setTxHash("");
    setInvestmentResult(null);

    try {
      if (saleAvailability?.available !== true) {
        throw new Error(
          saleAvailability?.message ||
            "This asset is not currently available for POL purchase on-chain.",
        );
      }
      let walletSigner = signer;
      const eth =
        typeof window !== "undefined" ? (window as any).ethereum : null;
      if (!walletSigner) {
        if (!eth) {
          throw new Error(
            "MetaMask is required for live Polygon Amoy transactions. Please install or enable the MetaMask browser extension.",
          );
        }
        handleProgress({
          stage: "checking_network",
          message: "Connecting wallet…",
        });
        await connect("MetaMask");
        const { ethers } = await import("ethers");
        const bp = new ethers.BrowserProvider(eth);
        walletSigner = await bp.getSigner().catch(() => null);
      }

      if (!walletSigner) {
        throw new Error(
          "Could not obtain wallet signer. Please unlock MetaMask and try again.",
        );
      }

      const result = await web3InvestmentService.executeInvestment(
        walletSigner,
        assetId,
        quantity,
        tokenPrice,
        handleProgress,
      );

      setInvestmentResult(result);
      setTxHash(result.txHash);
      setStep("success");
      onSuccess(result.txHash);
    } catch (err: any) {
      console.error("[PaymentModal] Investment failed:", err);
      setErrorMsg(
        err.message || "Investment transaction failed. Please try again.",
      );
      setStep("error");
      setStage("error");
    }
  }, [
    signer,
    isConnected,
    connect,
    assetId,
    quantity,
    tokenPrice,
    saleAvailability,
    handleProgress,
    onSuccess,
  ]);

  const activeStepIdx = stageToStepIndex(stage);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* ── CHECKOUT STEP ─────────────────────────────────────────────── */}
        {step === "checkout" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                Investment Checkout
              </h2>
              <p className="text-xs text-slate-400">{assetTitle}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens Requested</span>
                <span className="text-white font-semibold">{quantity} ACT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price per Token</span>
                <span className="text-white">
                  ₹{tokenPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                <span className="text-white">Total Investment</span>
                <span className="text-emerald-400">
                  ₹{totalInr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-600/20 border border-indigo-500 text-white space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-300" />
                  <span className="text-sm font-bold">
                    MetaMask · Polygon Amoy
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Real On-Chain
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pay in native POL. MetaMask will open a{" "}
                <strong className="text-white">Confirm Transaction</strong>{" "}
                popup with real gas fees.
              </p>
            </div>

            {!contractConfigured && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Contract not deployed. Set{" "}
                  <code>VITE_MARKETPLACE_CONTRACT_ADDRESS</code> after
                  deployment.
                </span>
              </div>
            )}

            {!isCorrectNetwork && isConnected && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Wrong network. System will prompt MetaMask to switch to
                  Polygon Amoy.
                </span>
              </div>
            )}

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Verified on-chain. Transaction recorded in{" "}
                <code>blockchain_transactions</code> table.
              </span>
            </div>

            {!signer &&
              typeof window !== "undefined" &&
              !(window as any).ethereum && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-200 text-xs">
                  Live on-chain purchases require the MetaMask extension.
                  Connect MetaMask and reopen the checkout.
                </div>
              )}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">
                  On-chain sale status
                </span>
                {availabilityLoading ? (
                  <span className="text-[10px] font-semibold text-indigo-300">
                    Checking…
                  </span>
                ) : saleAvailability?.available ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                {saleAvailability?.message ||
                  "Verifying this asset against the Polygon Amoy marketplace contract."}
              </p>
              <div className="flex items-center justify-between gap-3">
                {saleAvailability?.pricePOL ? (
                  <p className="text-slate-300 text-[11px]">
                    On-chain POL price:{" "}
                    <span className="text-emerald-300">
                      {saleAvailability.pricePOL} POL
                    </span>
                  </p>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    Price verification pending
                  </span>
                )}

                <button
                  onClick={refreshSaleAvailability}
                  disabled={availabilityLoading}
                  className="btn-secondary text-[11px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950/80 text-slate-200 hover:border-indigo-500/30 disabled:opacity-50"
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={
                  !contractConfigured ||
                  availabilityLoading ||
                  saleAvailability?.available === false ||
                  (!signer &&
                    typeof window !== "undefined" &&
                    !(window as any).ethereum)
                }
                className="btn-primary flex-1 text-xs gap-1.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Purchase with POL
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING STEPPER ────────────────────────────────────────── */}
        {step === "processing" && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                {stage === "awaiting_metamask"
                  ? "🦊 Check MetaMask Extension"
                  : "Executing On-Chain Settlement"}
              </h3>
              <p className="text-xs text-indigo-300 font-medium animate-pulse">
                {stageMessage || STEPPER_STAGES[activeStepIdx]?.label}
              </p>
            </div>

            {/* Granular 6-Stage Stepper */}
            <div className="space-y-2">
              {STEPPER_STAGES.map((s, idx) => {
                const isDone = activeStepIdx > idx;
                const isActive = activeStepIdx === idx;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                      isDone
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : isActive
                        ? "bg-indigo-600/20 border border-indigo-500/50 text-white shadow-lg"
                        : "bg-slate-950/40 border border-slate-800/40 text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 shrink-0 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                        {idx + 1}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">
                        {s.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {s.subtext}
                      </div>
                    </div>

                    {isActive && stage === "awaiting_metamask" && (
                      <span className="text-amber-300 font-bold animate-pulse text-[10px] shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        Confirm Popup
                      </span>
                    )}

                    {isDone && idx === 4 && txHash && (
                      <a
                        href={buildPolygonScanTxUrl(txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:text-indigo-200 text-[10px] flex items-center gap-1 shrink-0"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {txHash && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400">Transaction: </span>
                <a
                  href={buildPolygonScanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 font-mono break-all"
                >
                  {txHash.slice(0, 20)}…{txHash.slice(-8)}
                  <ExternalLink className="inline w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── SUCCESS STEP ──────────────────────────────────────────────── */}
        {step === "success" && investmentResult && (
          <div className="space-y-4 py-2">
            <InvestmentConfirmationCard
              assetTitle={assetTitle}
              investmentAmount={tokenPrice * quantity}
              tokensPurchased={quantity}
              tokenSupply={10000}
              nextDistributionDate="15 Aug 2026"
              spvVerified={true}
            />

            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Transaction Confirmed on Polygon Amoy
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Hash</span>
                <span className="text-white font-mono">
                  {txHash.slice(0, 14)}…{txHash.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Block Number</span>
                <span className="text-white">
                  #{investmentResult.blockNumber.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-emerald-400 font-semibold">
                  {investmentResult.amountPaidPOL} POL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gas Used</span>
                <span className="text-white">
                  {parseInt(investmentResult.gasUsed).toLocaleString()} gas
                  units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Confirmed (status = 1)
                </span>
              </div>
            </div>

            <a
              href={investmentResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              View Transaction on PolygonScan
            </a>

            <button
              onClick={() => setShowTrackerModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              Inspect Smart Contract Details
            </button>

            <button onClick={onClose} className="btn-primary w-full text-xs">
              <ArrowRight className="w-4 h-4" />
              Done — View Portfolio
            </button>
          </div>
        )}

        {/* ── ERROR STEP ────────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-bold text-sm">Transaction Failed</p>
              <p className="text-red-300 max-w-sm text-center">{errorMsg}</p>
            </div>

            {errorMsg.includes("POL") && (
              <a
                href="https://faucet.polygon.technology/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1 text-[11px]"
              >
                Get free testnet POL from Polygon Faucet{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => {
                  setStep("checkout");
                  setErrorMsg("");
                  setStage("idle");
                }}
                className="btn-primary flex-1"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <SmartContractTrackerModal
          isOpen={showTrackerModal}
          onClose={() => setShowTrackerModal(false)}
          contractName="Marketplace"
          contractAddress={
            MARKETPLACE_ADDRESS || "0x0000000000000000000000000000000000000000"
          }
          functionName={`buyTokensWithPOL(assetId="${assetId}", quantity=${quantity})`}
          txHash={
            txHash ||
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          }
          networkName="Polygon Amoy Testnet"
          chainId={80002}
          walletAddress={address}
          estimatedGas="~85,000 gas"
          status={txHash ? "confirmed" : "pending"}
        />
      </div>
    </div>,
    document.body,
  );
}
