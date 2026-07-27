import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Vote,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Globe2,
} from 'lucide-react';

export function Landing() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 to-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" /> Tokenizing Real-World Assets on Polygon Amoy
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Democratizing Ownership of High-Value Assets Through <span className="gradient-text">Blockchain Tokens</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Fractional real estate, commercial property, art, and renewable energy. Transparent governance, automated profit distribution, and instant liquidity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/marketplace" className="btn-primary w-full sm:w-auto text-base py-3 px-8">
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/register" className="btn-secondary w-full sm:w-auto text-base py-3 px-8">
            Tokenize Your Asset
          </Link>
        </div>

        {/* Stats preview */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass-card border border-indigo-500/15 max-w-4xl mx-auto">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-white">$12.5M+</div>
            <div className="text-xs text-slate-400">Total Asset Valuation</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400">On-Chain Verified</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-indigo-400">4.8%</div>
            <div className="text-xs text-slate-400">Avg. APY Return</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-white">2.4k+</div>
            <div className="text-xs text-slate-400">Verified Investors</div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold text-white">Why Invest with AssetChain?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Eliminating traditional barriers to real-world asset investing with enterprise smart contract security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Fractional Ownership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start investing with as little as $10. Purchase ERC-20 ownership tokens representing legal claim on asset revenues.
            </p>
          </div>

          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Profit Share</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rental yields and operational profits are deposited directly into the smart contract treasury for non-reentrant claims.
            </p>
          </div>

          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">On-Chain DAO Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Token holders vote on key decisions including property sales, maintenance, and distribution schedules proportional to holdings.
            </p>
          </div>
        </div>
      </section>

      {/* Asset Category Showcase */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="p-10 glass-card bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/20 rounded-3xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Supported Asset Classes</h3>
              <p className="text-slate-400 text-xs mt-1">Multi-category tokenization support built for compliance.</p>
            </div>
            <Link to="/marketplace" className="btn-secondary text-xs">View All Listed Assets</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Residential Real Estate', count: '14 Assets', icon: Building2 },
              { name: 'Commercial Property', count: '8 Assets', icon: Layers },
              { name: 'Renewable Energy', count: '5 Assets', icon: Globe2 },
              { name: 'Artwork & Collectibles', count: '11 Assets', icon: ShieldCheck },
            ].map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <cat.icon className="w-5 h-5 text-indigo-400" />
                <div className="text-sm font-semibold text-white">{cat.name}</div>
                <div className="text-xs text-slate-400">{cat.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
