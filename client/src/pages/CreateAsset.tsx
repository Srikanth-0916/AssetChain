import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { ASSET_TYPE_LABELS, AssetType } from '../types/asset';
import { Building2, AlertCircle, ArrowRight, CheckCircle2, DollarSign, Coins, MapPin } from 'lucide-react';

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

  const tokenPrice =
    valuation && tokenSupply && Number(tokenSupply) > 0
      ? (Number(valuation) / Number(tokenSupply)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!valuation || Number(valuation) <= 0) throw new Error('Valuation must be positive');
      if (!tokenSupply || Number(tokenSupply) <= 0) throw new Error('Token supply must be positive');

      await assetService.createAsset({
        title,
        description,
        asset_type: assetType,
        location,
        valuation: Number(valuation),
        token_supply: Number(tokenSupply),
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit asset for verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Register & Tokenize Asset</h1>
        <p className="text-xs text-slate-400">Submit physical asset details for admin verification and ERC-20 tokenization</p>
      </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Total Asset Valuation (USD)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                required
                min={1}
                value={valuation}
                onChange={(e) => setValuation(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="500000"
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
          <span className="text-emerald-400 font-bold text-base">${tokenPrice} / token</span>
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
