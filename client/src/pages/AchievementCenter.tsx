import { useState } from 'react';
import { Award, Lock, Trophy, Star, Filter } from 'lucide-react';

const ACHIEVEMENTS = [
  /* Unlocked */
  {
    id: 'first_invest',   emoji: '🚀', title: 'First Investment',       desc: 'Made your very first investment on AssetChain',
    pts: 500,  unlocked: true,  date: '2024-12-01', rarity: 'Common',   category: 'Investment',
  },
  {
    id: 'kyc_done',       emoji: '✅', title: 'Identity Verified',       desc: 'Completed full KYC verification',
    pts: 200,  unlocked: true,  date: '2024-11-28', rarity: 'Common',   category: 'Profile',
  },
  {
    id: 'profile_done',   emoji: '👤', title: 'Profile Complete',        desc: 'Filled in all profile information',
    pts: 100,  unlocked: true,  date: '2024-11-28', rarity: 'Common',   category: 'Profile',
  },
  {
    id: 'dao_voter',      emoji: '🗳️', title: 'DAO Participant',          desc: 'Cast your first governance vote',
    pts: 50,   unlocked: true,  date: '2024-12-08', rarity: 'Common',   category: 'Governance',
  },
  {
    id: 'referrer',       emoji: '🎁', title: 'Community Builder',        desc: 'Referred a friend who completed registration',
    pts: 300,  unlocked: true,  date: '2024-12-10', rarity: 'Rare',     category: 'Social',
  },
  {
    id: '100k_invested',  emoji: '💰', title: '₹1L Investor',             desc: 'Total portfolio crossed ₹1,00,000',
    pts: 1000, unlocked: true,  date: '2025-01-02', rarity: 'Rare',     category: 'Investment',
  },
  {
    id: 'gold_level',     emoji: '🥇', title: 'Gold Status Achieved',     desc: 'Reached Gold Investor level',
    pts: 0,    unlocked: true,  date: '2025-01-02', rarity: 'Epic',     category: 'Level',
  },
  {
    id: 'wallet_linked',  emoji: '🔗', title: 'Wallet Pioneer',           desc: 'Connected a Web3 wallet to your account',
    pts: 75,   unlocked: true,  date: '2024-11-30', rarity: 'Common',   category: 'Profile',
  },

  /* Locked */
  {
    id: 'portfolio_builder', emoji: '📊', title: 'Portfolio Builder',     desc: 'Own 5 or more different asset tokens',
    pts: 300,  unlocked: false, date: null,          rarity: 'Rare',     category: 'Investment',
    hint: '3/5 assets diversified',
  },
  {
    id: 'long_term',      emoji: '⏳', title: 'Long-Term Investor',       desc: 'Hold any asset token for 6 consecutive months',
    pts: 500,  unlocked: false, date: null,          rarity: 'Rare',     category: 'Investment',
    hint: '4 months held so far',
  },
  {
    id: 'diversify_master', emoji: '🌐', title: 'Diversification Master', desc: 'Invest in 3 different asset sectors',
    pts: 400,  unlocked: false, date: null,          rarity: 'Epic',     category: 'Investment',
    hint: '2/3 sectors covered',
  },
  {
    id: 'dao_legend',     emoji: '⚖️', title: 'Governance Legend',       desc: 'Vote in 10 governance proposals',
    pts: 500,  unlocked: false, date: null,          rarity: 'Epic',     category: 'Governance',
    hint: '2/10 votes cast',
  },
  {
    id: 'top_investor',   emoji: '🏆', title: 'Top Investor',             desc: 'Reach the top 100 on the leaderboard',
    pts: 2000, unlocked: false, date: null,          rarity: 'Legendary',category: 'Investment',
    hint: 'Currently ranked #142',
  },
  {
    id: 'elite_holder',   emoji: '👑', title: 'TrustChain Elite',         desc: 'Earn 10,000 total reward points',
    pts: 0,    unlocked: false, date: null,          rarity: 'Legendary',category: 'Level',
    hint: '3,250 / 10,000 points',
  },
  {
    id: 'property_expert',emoji: '🏠', title: 'Property Expert',          desc: 'Invest in 3 real estate asset tokens',
    pts: 350,  unlocked: false, date: null,          rarity: 'Rare',     category: 'Investment',
    hint: '1/3 property assets',
  },
  {
    id: 'referral_king',  emoji: '🌟', title: 'Referral Champion',        desc: 'Refer 5 friends who all make their first investment',
    pts: 1500, unlocked: false, date: null,          rarity: 'Legendary',category: 'Social',
    hint: '1/5 friends invested',
  },
];

const RARITY_COLORS: Record<string, string> = {
  Common:    'pill-neutral',
  Rare:      'pill-info',
  Epic:      'text-purple-400 bg-purple-500/10 border border-purple-500/20',
  Legendary: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
};

const CATEGORIES = ['All', 'Investment', 'Profile', 'Governance', 'Social', 'Level'];

export function AchievementCenter() {
  const [filter, setFilter]       = useState('All');
  const [showLocked, setShowLocked] = useState(true);
  const [selected, setSelected]   = useState<typeof ACHIEVEMENTS[0] | null>(null);

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked);
  const locked   = ACHIEVEMENTS.filter(a => !a.unlocked);
  const totalPts = unlocked.reduce((s, a) => s + a.pts, 0);

  const filteredUnlocked = filter === 'All' ? unlocked : unlocked.filter(a => a.category === filter);
  const filteredLocked   = filter === 'All' ? locked   : locked.filter(a => a.category === filter);

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/10 border border-purple-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Achievement Center</h1>
            <p className="text-sm text-slate-400">Your investing milestones and badges</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-3xl font-black gradient-text">{unlocked.length}<span className="text-slate-500 font-normal text-xl"> / {ACHIEVEMENTS.length}</span></div>
          <div className="text-xs text-slate-500">Achievements Unlocked</div>
        </div>
      </div>

      {/* ── Progress banner ── */}
      <div className="stat-card mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Overall Progress</span>
            <span className="text-sm text-indigo-400 font-bold">{unlocked.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{locked.length} achievements remaining to unlock</p>
        </div>
        <div className="flex gap-6 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-400">{totalPts.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Pts Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">
              {locked.filter(a => a.rarity === 'Legendary').length}
            </div>
            <div className="text-xs text-slate-500">Legendary Left</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="tab-bar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`tab-item ${filter === cat ? 'active' : ''}`}>{cat}</button>
          ))}
        </div>
        <button
          onClick={() => setShowLocked(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
            ${showLocked ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-500'}`}
        >
          <Lock className="w-3 h-3" />
          {showLocked ? 'Hide Locked' : 'Show Locked'}
        </button>
      </div>

      {/* ── Unlocked Grid ── */}
      <div className="mb-8">
        <p className="section-header mb-4">
          <Award className="w-4 h-4 text-emerald-400" />
          Unlocked ({filteredUnlocked.length})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger-children">
          {filteredUnlocked.map(a => (
            <div
              key={a.id}
              className="achievement-card unlocked cursor-pointer animate-slide-up"
              onClick={() => setSelected(a)}
            >
              <div className="achievement-icon bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border-indigo-500/30">
                <span>{a.emoji}</span>
              </div>
              <div>
                <div className="font-semibold text-white text-sm leading-tight">{a.title}</div>
                <div className="mt-1">
                  <span className={`pill-badge text-xs ${RARITY_COLORS[a.rarity]}`}>{a.rarity}</span>
                </div>
              </div>
              {a.pts > 0 && (
                <div className="text-xs text-amber-400 font-bold">+{a.pts} pts</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Locked Grid ── */}
      {showLocked && (
        <div>
          <p className="section-header mb-4">
            <Lock className="w-4 h-4 text-slate-500" />
            Locked ({filteredLocked.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredLocked.map(a => (
              <div
                key={a.id}
                className="achievement-card locked cursor-pointer"
                onClick={() => setSelected(a)}
              >
                <div className="achievement-icon relative">
                  <span className="blur-[2px]">{a.emoji}</span>
                  <Lock className="w-4 h-4 text-slate-400 absolute inset-0 m-auto" />
                </div>
                <div>
                  <div className="font-semibold text-slate-400 text-sm leading-tight">{a.title}</div>
                  <div className="mt-1">
                    <span className={`pill-badge text-xs ${RARITY_COLORS[a.rarity]}`}>{a.rarity}</span>
                  </div>
                </div>
                {a.pts > 0 && <div className="text-xs text-slate-600 font-bold">+{a.pts} pts</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-card p-8 max-w-sm w-full animate-fade-scale text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4
              ${selected.unlocked ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-slate-800 border border-slate-700'}`}>
              {selected.emoji}
            </div>
            <div className="text-xl font-bold text-white mb-1">{selected.title}</div>
            <span className={`pill-badge mb-3 ${RARITY_COLORS[selected.rarity]}`}>{selected.rarity}</span>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{selected.desc}</p>
            {selected.unlocked ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                <Award className="w-4 h-4" /> Unlocked on {selected.date}
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-900/50 rounded-lg p-3">
                🔒 {selected.hint}
              </div>
            )}
            <button onClick={() => setSelected(null)} className="btn-ghost w-full mt-4 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
