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
  const [claimedIds, setClaimedIds] = useState<string[]>(['first_invest', 'kyc_done']);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked);
  const locked   = ACHIEVEMENTS.filter(a => !a.unlocked);
  const totalPts = unlocked.reduce((s, a) => s + a.pts, 0);

  const filteredUnlocked = filter === 'All' ? unlocked : unlocked.filter(a => a.category === filter);
  const filteredLocked   = filter === 'All' ? locked   : locked.filter(a => a.category === filter);

  const handleClaim = (achievement: typeof ACHIEVEMENTS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (claimedIds.includes(achievement.id)) return;
    setClaimedIds(prev => [...prev, achievement.id]);
    setClaimNotice(`🎉 Claimed +${achievement.pts} Points for "${achievement.title}"!`);
    setTimeout(() => setClaimNotice(null), 3000);
  };

  return (
    <div className="page-container animate-fade-in">

      {/* Claim Toast Banner */}
      {claimNotice && (
        <div className="fixed top-20 right-8 z-50 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce flex items-center gap-2 border border-white/20">
          <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
          {claimNotice}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Trophy className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Achievement Center</h1>
            <p className="text-sm text-slate-400">Track milestones, level up, and claim exclusive investor rewards</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-3xl font-black gradient-text">{unlocked.length}<span className="text-slate-500 font-normal text-xl"> / {ACHIEVEMENTS.length}</span></div>
          <div className="text-xs text-slate-500">Milestones Achieved</div>
        </div>
      </div>

      {/* ── Progress banner ── */}
      <div className="stat-card mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-200">Overall Progress (Level 3 — Gold Status)</span>
            <span className="text-sm text-indigo-400 font-bold">{unlocked.length}/{ACHIEVEMENTS.length} ({Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%)</span>
          </div>
          <div className="progress-bar-track h-3">
            <div className="progress-bar-fill h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{locked.length} achievements remaining to reach Platinum Tier</p>
        </div>
        <div className="flex gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-400">{totalPts.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Pts Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-purple-400">
              {claimedIds.length} / {unlocked.length}
            </div>
            <div className="text-xs text-slate-400">Claimed</div>
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
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors
            ${showLocked ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-500'}`}
        >
          <Lock className="w-3.5 h-3.5" />
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
          {filteredUnlocked.map(a => {
            const isClaimed = claimedIds.includes(a.id);
            return (
              <div
                key={a.id}
                className="achievement-card unlocked cursor-pointer animate-slide-up group relative"
                onClick={() => setSelected(a)}
              >
                <div className="achievement-icon bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <span>{a.emoji}</span>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm leading-tight group-hover:text-indigo-300 transition-colors">{a.title}</div>
                  <div className="mt-1">
                    <span className={`pill-badge text-xs ${RARITY_COLORS[a.rarity]}`}>{a.rarity}</span>
                  </div>
                </div>
                {a.pts > 0 && (
                  <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800/60 mt-1">
                    <span className="text-xs text-amber-400 font-bold">+{a.pts} pts</span>
                    {isClaimed ? (
                      <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">✓ Claimed</span>
                    ) : (
                      <button
                        onClick={(e) => handleClaim(a, e)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
                      >
                        Claim!
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
                className="achievement-card locked cursor-pointer hover:border-slate-700 transition-colors"
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
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-card p-8 max-w-sm w-full animate-fade-scale text-center border border-indigo-500/30 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg
              ${selected.unlocked ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
              {selected.emoji}
            </div>
            <div className="text-xl font-bold text-white mb-1">{selected.title}</div>
            <span className={`pill-badge mb-3 ${RARITY_COLORS[selected.rarity]}`}>{selected.rarity}</span>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{selected.desc}</p>
            
            {selected.unlocked ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                  <Award className="w-4 h-4" /> Unlocked on {selected.date}
                </div>
                {selected.pts > 0 && (
                  claimedIds.includes(selected.id) ? (
                    <div className="text-xs text-slate-400 font-medium py-2">
                      ✓ Reward +{selected.pts} Pts Claimed
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleClaim(selected, e)}
                      className="btn-primary text-xs py-2.5 w-full flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300" /> Claim +{selected.pts} Reward Points
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                🔒 <span className="font-semibold text-slate-300">How to Unlock:</span> {selected.hint}
              </div>
            )}
            
            <button onClick={() => setSelected(null)} className="btn-ghost w-full mt-4 text-xs py-2">Close Modal</button>
          </div>
        </div>
      )}
    </div>
  );
}
