import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, Receipt, FileText, MessageSquare, Bell,
  PieChart, Shield, X, ArrowRight, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_CATEGORIES = [
  { id: 'assets', label: 'Assets & RWAs', icon: <Building2 className="w-4 h-4 text-indigo-400" /> },
  { id: 'portfolio', label: 'Portfolio & Holdings', icon: <PieChart className="w-4 h-4 text-emerald-400" /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt className="w-4 h-4 text-purple-400" /> },
  { id: 'discussions', label: 'Discussions & Forum', icon: <MessageSquare className="w-4 h-4 text-amber-400" /> },
  { id: 'reports', label: 'Compliance & Audit Logs', icon: <Shield className="w-4 h-4 text-cyan-400" /> },
];

const SEARCH_DATABASE = [
  { id: 'a1', category: 'assets', title: 'Manhattan Commercial Plaza', subtitle: 'Class-A Office • Valuation $2,500,000 • Yield 8.2%', link: '/marketplace' },
  { id: 'a2', category: 'assets', title: 'Solar Farm Alpha 1', subtitle: 'Utility Renewable • Valuation $1,200,000 • Yield 9.5%', link: '/marketplace' },
  { id: 'a3', category: 'assets', title: 'Luxury Villa Compound', subtitle: 'Dubai Residential • Valuation $4,500,000 • Yield 7.8%', link: '/marketplace' },
  { id: 'p1', category: 'portfolio', title: 'Manhattan Plaza Position', subtitle: '2,500 Tokens • Value $625,000 • ROI +14.2%', link: '/portfolio' },
  { id: 't1', category: 'transactions', title: 'Dividend Payout #4829', subtitle: '+$2,450 USDC • Confirmed on Polygon Amoy', link: '/transactions' },
  { id: 'd1', category: 'discussions', title: 'BKC Tower Q3 Inspection', subtitle: '3 Comments • AI Sentiment: Positive', link: '/marketplace' },
  { id: 'r1', category: 'reports', title: 'ERC-3643 Audit Certificate', subtitle: 'Verified Title Deed & Compliance Approval', link: '/auditor' },
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent if needed
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = SEARCH_DATABASE.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchesCat   = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search assets, investments, transactions, discussions, documents... (press ESC to close)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-white/[0.06] bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0
              ${selectedCategory === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            All Results
          </button>
          {SEARCH_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0
                ${selectedCategory === cat.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results listing */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-1">
          {filteredResults.length > 0 ? (
            filteredResults.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  navigate(item.link);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer group"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-sm font-semibold text-white group-hover:text-indigo-300 flex items-center gap-2">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">{item.subtitle}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <div>No results matching "{query}"</div>
              <div className="text-xs text-slate-600">Try searching for "Manhattan", "Solar", "USDC", or "Audit"</div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">ESC</kbd> Close</span>
          </div>
          <span className="text-indigo-400 font-medium">TrustChain Intelligence Engine</span>
        </div>
      </div>
    </div>
  );
}
