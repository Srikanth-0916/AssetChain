import { Coins, Globe, Disc as Discord } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-indigo-500/10 pt-12 pb-8 px-4 lg:px-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            Asset<span className="text-indigo-400">Chain</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Institutional-grade real-world asset tokenization platform powered by Polygon blockchain and smart contract automation.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/marketplace" className="hover:text-indigo-400 transition-colors">Marketplace</Link></li>
            <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Tokenize Asset</Link></li>
            <li><Link to="/dao" className="hover:text-indigo-400 transition-colors">Governance</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Legal & Security</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-indigo-400 transition-colors">KYC/AML Policy</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Smart Contract Audit</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Network</h4>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Network:</span>
              <span className="text-emerald-400 font-mono">Polygon Amoy</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Chain ID:</span>
              <span className="text-slate-300 font-mono">80002</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
        <p>© 2026 AssetChain. All rights reserved.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <a href="#" className="hover:text-white transition-colors" title="Global Network"><Globe className="w-4 h-4" /></a>
          <a href="#" className="hover:text-white transition-colors" title="Community"><Discord className="w-4 h-4" /></a>
        </div>
      </div>
    </footer>
  );
}
