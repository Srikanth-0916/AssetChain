import { Coins, Search, Filter } from 'lucide-react';
import { ASSET_TYPE_LABELS, AssetType } from '../types/asset';

export function Marketplace() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tokenized Asset Marketplace</h1>
          <p className="text-xs text-slate-400">Discover and invest in fractional real-world assets verified on Polygon</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by asset title, location, or keyword..."
            className="input-field pl-10"
          />
        </div>
        <button className="btn-secondary text-xs flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter Categories
        </button>
      </div>

      {/* Sample Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Manhattan Commercial Plaza',
            type: 'commercial_property' as AssetType,
            location: 'New York, USA',
            valuation: 2500000,
            tokenPrice: 250,
            yield: '8.5%',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: 'Solar Farm Alpha 1',
            type: 'renewable_energy' as AssetType,
            location: 'Valencia, Spain',
            valuation: 1200000,
            tokenPrice: 120,
            yield: '10.2%',
            image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: 'Luxury Villa Compound',
            type: 'residential_real_estate' as AssetType,
            location: 'Dubai, UAE',
            valuation: 4500000,
            tokenPrice: 450,
            yield: '7.8%',
            image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
          },
        ].map((item, index) => (
          <div key={index} className="glass-card-hover overflow-hidden flex flex-col">
            <div className="h-44 bg-slate-900 relative overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                {ASSET_TYPE_LABELS[item.type]}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Valuation</span>
                  <span className="font-semibold text-white">${item.valuation.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Est. Yield</span>
                  <span className="font-semibold text-emerald-400">{item.yield}</span>
                </div>
              </div>

              <button className="btn-primary w-full text-xs">
                <Coins className="w-3.5 h-3.5" /> View Listing & Buy Tokens
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
