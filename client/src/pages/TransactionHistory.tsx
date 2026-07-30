import { useState } from 'react';
import {
  Receipt, TrendingUp, ArrowUpRight, Vote, Star, ExternalLink,
  ChevronDown, ChevronUp, Download, Filter, Search, Copy, Check
} from 'lucide-react';

type TxCategory = 'all' | 'investment' | 'income' | 'governance' | 'reward';

interface Transaction {
  id: string;
  type: TxCategory;
  icon: string;
  asset: string;
  description: string;
  amount: string;
  amountPositive: boolean;
  status: 'Confirmed' | 'Pending' | 'Failed';
  date: string;
  time: string;
  txHash: string;
  block: string;
  gasUsed?: string;
  network: string;
}

const TRANSACTIONS: Transaction[] = [
  { id:'t1',  type:'income',     icon:'💰', asset:'Green Valley Property',  description:'Q4 Rental Income Distribution',    amount:'+₹2,450',  amountPositive:true,  status:'Confirmed', date:'2025-01-20', time:'10:32 AM', txHash:'0xa3f9c1d2e4b6f8a1b3c5d7e9f0a2b4c6d8e0f2a4', block:'51,234,891', gasUsed:'21,000', network:'Polygon Amoy' },
  { id:'t2',  type:'investment', icon:'🏗️', asset:'TechHub Commercial',      description:'Purchase of 25 TCHB tokens',        amount:'-₹25,000', amountPositive:false, status:'Confirmed', date:'2025-01-19', time:'02:10 PM', txHash:'0xc4d8e3b7f1a9d2c5e8f0b3a6c9e2f5a8b1d4e7f0', block:'51,198,342', gasUsed:'85,000', network:'Polygon Amoy' },
  { id:'t3',  type:'governance', icon:'🗳️', asset:'DAO Governance',          description:'Proposal #47 — Vote Cast',          amount:'',         amountPositive:true,  status:'Confirmed', date:'2025-01-18', time:'06:45 PM', txHash:'0xb17ea9f2d4c8e1f3a5b7c9d2e4f6a8b0c2d4e6f8a0', block:'51,167,230', gasUsed:'42,000', network:'Polygon Amoy' },
  { id:'t4',  type:'income',     icon:'☀️', asset:'AgriTech Solar Farm',     description:'Q4 Dividend Distribution',          amount:'+₹1,800',  amountPositive:true,  status:'Confirmed', date:'2025-01-16', time:'11:00 AM', txHash:'0xd9e2f37c8b1a4d6f9e2c5a8b3f0e7c1d4a7f2e9c6', block:'51,089,754', gasUsed:'21,000', network:'Polygon Amoy' },
  { id:'t5',  type:'reward',     icon:'⭐', asset:'Rewards System',          description:'Referral Bonus — Friend Joined',    amount:'+300 pts', amountPositive:true,  status:'Confirmed', date:'2025-01-15', time:'09:20 AM', txHash:'0xe1f3a5b7c9d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2', block:'51,061,445', gasUsed:'—',       network:'Off-chain' },
  { id:'t6',  type:'investment', icon:'🌾', asset:'AgriTech Solar Farm',     description:'Purchase of 50 AGRI tokens',        amount:'-₹50,000', amountPositive:false, status:'Confirmed', date:'2025-01-10', time:'03:30 PM', txHash:'0xf2a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8', block:'50,934,120', gasUsed:'85,000', network:'Polygon Amoy' },
  { id:'t7',  type:'income',     icon:'🏠', asset:'Green Valley Property',   description:'December Rental Income',            amount:'+₹2,200',  amountPositive:true,  status:'Confirmed', date:'2024-12-20', time:'10:00 AM', txHash:'0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1', block:'50,456,789', gasUsed:'21,000', network:'Polygon Amoy' },
  { id:'t8',  type:'governance', icon:'🗳️', asset:'DAO Governance',          description:'Proposal #38 — Asset Addition',     amount:'',         amountPositive:true,  status:'Confirmed', date:'2024-12-08', time:'04:15 PM', txHash:'0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', block:'50,187,003', gasUsed:'42,000', network:'Polygon Amoy' },
  { id:'t9',  type:'reward',     icon:'⭐', asset:'Rewards System',          description:'First Investment Bonus',            amount:'+500 pts', amountPositive:true,  status:'Confirmed', date:'2024-12-01', time:'11:47 AM', txHash:'0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', block:'49,987,654', gasUsed:'—',       network:'Off-chain' },
  { id:'t10', type:'investment', icon:'🏘️', asset:'Green Valley Property',   description:'Purchase of 10 GVP tokens',         amount:'-₹10,000', amountPositive:false, status:'Confirmed', date:'2024-12-01', time:'11:45 AM', txHash:'0xf2a1c3b5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8', block:'49,987,322', gasUsed:'85,000', network:'Polygon Amoy' },
];

const CATEGORY_TABS: { label: string; value: TxCategory }[] = [
  { label: 'All Transactions', value: 'all' },
  { label: 'Investments',      value: 'investment' },
  { label: 'Income',           value: 'income' },
  { label: 'Governance',       value: 'governance' },
  { label: 'Rewards',          value: 'reward' },
];

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'pill-success',
  Pending:   'pill-warning',
  Failed:    'pill-danger',
};

function truncateTx(tx: string) {
  return `${tx.slice(0,10)}...${tx.slice(-6)}`;
}

export function TransactionHistory() {
  const [category, setCategory]  = useState<TxCategory>('all');
  const [search, setSearch]      = useState('');
  const [expanded, setExpanded]  = useState<string | null>(null);

  const filtered = TRANSACTIONS.filter(tx => {
    const matchCat  = category === 'all' || tx.type === category;
    const matchSearch = search === '' || tx.asset.toLowerCase().includes(search.toLowerCase()) || tx.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalIn  = TRANSACTIONS.filter(t=>t.amountPositive && t.amount.startsWith('+')).reduce((s,t) => s + parseFloat(t.amount.replace(/[^0-9.]/g,'')), 0);
  const totalOut = TRANSACTIONS.filter(t=>!t.amountPositive && t.amount.startsWith('-')).reduce((s,t) => s + parseFloat(t.amount.replace(/[^0-9.]/g,'')), 0);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyHash = (txHash: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(txHash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadReceipt = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `=======================================================
ASSETCHAIN OFFICIAL TRANSACTION RECEIPT
=======================================================
Receipt Ref ID : ${tx.id.toUpperCase()}
Asset Token    : ${tx.asset}
Activity       : ${tx.description}
Transaction Amt: ${tx.amount || 'N/A'}
Status         : ${tx.status}
Timestamp      : ${tx.date} at ${tx.time}
Network        : ${tx.network}
Block Number   : ${tx.block}
Gas Units Used : ${tx.gasUsed || 'N/A'}
Tx Hash        : ${tx.txHash}
=======================================================
Verified via AssetChain Protocol (Polygon Amoy Testnet)
Generated at: ${new Date().toISOString()}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AssetChain_Receipt_${tx.id}_${tx.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-600/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Receipt className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Transaction History</h1>
            <p className="text-sm text-slate-400">Complete record of your on-chain settlements and platform activity</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Transactions', value: TRANSACTIONS.length, color: 'text-white', badge: 'All-Time' },
          { label: 'Total Invested',     value: `₹${totalOut.toLocaleString()}`, color: 'text-red-400', badge: 'Capital' },
          { label: 'Total Income',       value: `₹${(totalIn).toLocaleString()}`, color: 'text-emerald-400', badge: 'Yield' },
          { label: 'Net Position',       value: `+₹${(totalIn-totalOut<0?0:totalIn-totalOut).toLocaleString()}`, color: 'text-indigo-400', badge: 'ROI' },
        ].map(s => (
          <div key={s.label} className="stat-card py-4 px-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{s.badge}</span>
            </div>
            <div className={`text-2xl font-black ${s.color} mt-2`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="overflow-x-auto flex-1">
          <div className="tab-bar inline-flex min-w-max">
            {CATEGORY_TABS.map(t => (
              <button key={t.value} onClick={() => setCategory(t.value)} className={`tab-item ${category === t.value ? 'active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input-field pl-9 py-2 text-sm w-56"
            placeholder="Search asset or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-800/60 bg-slate-900/40">
          <span>Type</span>
          <span>Details</span>
          <span className="text-right">Amount</span>
          <span className="text-right hidden sm:block">Status</span>
          <span className="text-right hidden sm:block">Date</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No transactions match your filter criteria</p>
          </div>
        )}

        <div className="divide-y divide-slate-800/60">
          {filtered.map(tx => {
            const isExpanded = expanded === tx.id;
            return (
              <div key={tx.id}>
                <div
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/40 transition-colors items-center"
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg shrink-0 shadow-inner">
                    {tx.icon}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{tx.asset}</div>
                    <div className="text-xs text-slate-400 truncate">{tx.description}</div>
                  </div>

                  {/* Amount */}
                  <div className={`text-sm font-bold text-right ${tx.amountPositive ? 'text-emerald-400' : tx.amount ? 'text-red-400' : 'text-slate-500'}`}>
                    {tx.amount || '—'}
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block text-right">
                    <span className={`pill-badge ${STATUS_STYLES[tx.status]}`}>{tx.status}</span>
                  </div>

                  {/* Date */}
                  <div className="hidden sm:flex items-center gap-2 text-right shrink-0">
                    <div className="text-xs text-slate-400 text-right">
                      <div>{tx.date}</div>
                      <div className="text-[11px] text-slate-500">{tx.time}</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Receipt Drawer */}
                {isExpanded && (
                  <div className="bg-slate-900/80 border-t border-slate-800/80 px-6 py-5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
                      {[
                        { label: 'Transaction Hash', value: tx.txHash, mono: true, copyable: true },
                        { label: 'Block Number',     value: tx.block, mono: true },
                        { label: 'Network',          value: tx.network, mono: false },
                        { label: 'Gas Units Used',   value: tx.gasUsed || '—', mono: true },
                        { label: 'Date & Time',      value: `${tx.date} at ${tx.time}`, mono: false },
                        { label: 'Verification Status', value: tx.status, mono: false },
                      ].map(row => (
                        <div key={row.label} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{row.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs text-slate-200 ${row.mono ? 'font-mono bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/20 truncate' : 'font-medium'}`}>
                              {row.mono && row.value.length > 20 ? truncateTx(row.value) : row.value}
                            </span>
                            {row.copyable && (
                              <button
                                onClick={(e) => handleCopyHash(tx.txHash, tx.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                                title="Copy full Hash"
                              >
                                {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {row.copyable && tx.network !== 'Off-chain' && (
                              <a
                                href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-indigo-400 hover:text-indigo-300 hover:bg-white/10 transition-colors shrink-0"
                                title="View on Polygonscan"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-800/60">
                      <button
                        onClick={(e) => handleDownloadReceipt(tx, e)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download Official Receipt (.TXT)
                      </button>
                      {copiedId === tx.id && (
                        <span className="text-xs text-emerald-400 font-medium animate-fade-in">
                          ✓ Tx Hash copied to clipboard!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
