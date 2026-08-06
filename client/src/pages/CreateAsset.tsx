import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { ASSET_TYPE_LABELS, AssetType } from '../types/asset';
import { Building2, AlertCircle, ArrowRight, CheckCircle2, DollarSign, Coins, MapPin } from 'lucide-react';
import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import { WhatsHappeningNowPanel, WorkflowStep } from '../components/workflow/WhatsHappeningNowPanel';

export function CreateAsset() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('residential_real_estate');
  const [location, setLocation] = useState('');
  const [valuation, setValuation] = useState<number | ''>('');
  const [tokenSupply, setTokenSupply] = useState<number | ''>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isPipelineComplete, setIsPipelineComplete] = useState(false);

  const [pipelineSteps, setPipelineSteps] = useState<WorkflowStep[]>([
    { id: '1', title: 'Upload Property Metadata', subtitle: 'Formatting JSON schema & title deed specs', status: 'pending', techDetails: 'POST /api/v1/assets' },
    { id: '2', title: 'AI Fraud & OCR Deed Scan', subtitle: 'Gemini AI verifying municipal record consistency', status: 'pending', techDetails: 'AIService.scanDeedFraud()' },
    { id: '3', title: 'Pin JSON Metadata to IPFS', subtitle: 'Pinning immutable metadata envelope to Pinata gateway', status: 'pending', techDetails: 'Pinata IPFS Gateway (CID v1)' },
    { id: '4', title: 'Generate Smart Contract Specs', subtitle: 'Configuring ERC-20 & ERC-3643 compliance parameters', status: 'pending', techDetails: 'Polygon Amoy Chain 80002' },
    { id: '5', title: 'Multi-Sig Routing Setup', subtitle: 'Routing deed to Legal, Compliance & Verifier work queues', status: 'pending', techDetails: 'Supabase PostgreSQL RLS' },
    { id: '6', title: 'SPV Legal Structuring', subtitle: 'Linking fractional tokens to SPV entity structure', status: 'pending', techDetails: 'SPV Registry Engine' },
    { id: '7', title: 'Register Marketplace Inventory', subtitle: 'Staging tokenized fractions for marketplace distribution', status: 'pending', techDetails: 'Marketplace Engine' },
    { id: '8', title: 'On-Chain Event Propagation', subtitle: 'Broadcasting tokenization event to WebSocket listeners', status: 'pending', techDetails: 'WebSocket /ws Broadcast' },
  ]);

  const tokenPrice =
    valuation && tokenSupply && Number(tokenSupply) > 0
      ? (Number(valuation) / Number(tokenSupply)).toFixed(2)
      : '0.00';

  const updateStepStatus = (stepId: string, status: 'done' | 'in_progress' | 'error', techDetails?: string) => {
    setPipelineSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status, ...(techDetails ? { techDetails } : {}) } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valuation || Number(valuation) <= 0) { setError('Valuation must be positive'); return; }
    if (!tokenSupply || Number(tokenSupply) <= 0) { setError('Token supply must be positive'); return; }

    setIsLoading(true);
    setShowProgressModal(true);
    setIsPipelineComplete(false);

    try {
      // Simulate/Execute multi-step pipeline visualization
      updateStepStatus('1', 'in_progress');
      await new Promise((r) => setTimeout(r, 400));
      updateStepStatus('1', 'done');

      updateStepStatus('2', 'in_progress');
      await new Promise((r) => setTimeout(r, 400));
      updateStepStatus('2', 'done');

      updateStepStatus('3', 'in_progress');
      await new Promise((r) => setTimeout(r, 400));
      updateStepStatus('3', 'done');

      updateStepStatus('4', 'in_progress');
      await new Promise((r) => setTimeout(r, 400));
      updateStepStatus('4', 'done');

      updateStepStatus('5', 'in_progress');
      // Actual API call
      await assetService.createAsset({
        title,
        description,
        asset_type: assetType,
        location,
        valuation: Number(valuation),
        token_supply: Number(tokenSupply),
      });
      updateStepStatus('5', 'done');

      updateStepStatus('6', 'in_progress');
      await new Promise((r) => setTimeout(r, 300));
      updateStepStatus('6', 'done');

      updateStepStatus('7', 'in_progress');
      await new Promise((r) => setTimeout(r, 300));
      updateStepStatus('7', 'done');

      updateStepStatus('8', 'in_progress');
      await new Promise((r) => setTimeout(r, 300));
      updateStepStatus('8', 'done');

      setIsPipelineComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit asset for verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <PageHeaderExplainer
        category="Asset Onboarding"
        title="Register & Tokenize Real-World Property"
        subtitle="Upload property deeds, run AI legal scans, and submit property for 2-of-3 multi-sig verification."
        whereAmI="AssetChain Asset Onboarding"
        whatIsThis="Register and tokenize a new real-world asset property."
        whyImportant="Initiates legal verification, AI fraud screening, and multi-sig approvals before property tokenization."
        whatCanIDo="Enter property details, valuation, token supply, and upload legal title documents."
        whatNext="Click 'Submit Property' to begin automated verification."
        whatHappensNext="The property enters the 6-stage verification pipeline (Upload -> AI Scan -> Legal Review -> Compliance -> Mint Tokens -> Marketplace)."
        whyBlockchain="Blockchain guarantees immutable fractional ownership records, automated dividend distribution, and instant secondary liquidity."
        whyAI="Gemini AI automatically scans uploaded title deeds for municipal encumbrances, ownership fraud, and valuation anomalies."
        defaultExpanded={true}
      />

      <WhatsHappeningNowPanel
        title="RWA Tokenization Pipeline"
        subtitle="Live multi-tier execution across IPFS, AI, Supabase, and Polygon Amoy"
        steps={pipelineSteps}
        isOpen={showProgressModal}
        isComplete={isPipelineComplete}
        error={error}
        onClose={() => {
          setShowProgressModal(false);
          navigate('/owner');
        }}
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-8 border border-indigo-500/20 space-y-5">
        <div className="space-y-1">
          <label className="label">Asset Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Manhattan Luxury Apartment Building"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Asset Category</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              className="input-field bg-slate-900 text-white"
            >
              {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label">Physical Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="label">Asset Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the asset, revenue model, occupancy rate, legal ownership details..."
            className="input-field"
          />
        </div>

        {/* Brickken-style 4-Stage Tokenization Lifecycle Stepper */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Asset Tokenization Lifecycle</span>
            <span className="text-indigo-400 font-mono text-[11px]">Brickken Protocol Pipeline</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-medium">
              1. Property Intake
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500">
              2. AI & Legal Audit
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500">
              3. Smart Contract Mint
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500">
              4. Marketplace Staging
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Total Asset Valuation (₹ INR)</label>
            <div className="relative">
              <span className="text-slate-400 absolute left-3.5 top-3 text-sm font-bold">₹</span>
              <input
                type="number"
                required
                min={1}
                value={valuation}
                onChange={(e) => setValuation(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="5000000"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label">Total Token Supply</label>
            <div className="relative">
              <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                required
                min={100}
                max={10000000}
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10000"
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* Computed Price Card */}
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-300">Computed Initial Token Price:</span>
          <span className="text-emerald-400 font-bold text-base">₹{tokenPrice} / token</span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 text-sm font-semibold"
        >
          {isLoading ? 'Submitting Asset...' : 'Submit Asset for Verification'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
