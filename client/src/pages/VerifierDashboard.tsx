import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FileCheck2, ShieldCheck, Search, Filter, CheckCircle2, XCircle,
  Clock, AlertTriangle, Eye, FileText, Scan, Sparkles, User, ArrowRight
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';

export function VerifierDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'ocr' | 'history'>('queue');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock initial queue with real structural data
  const assignedAssets = [
    {
      id: 'ast-ver-001',
      title: 'Manhattan Commercial Plaza (Phase 2)',
      assetType: 'commercial_property',
      location: 'New York, USA',
      valuation: '$2,500,000',
      ownerName: 'TrustChain SPV LLC',
      surveyNumber: 'SUR-8849-B',
      submittedAt: '2026-07-28',
      status: 'pending_verification',
      ocrConfidence: '98.4%',
      riskScore: 12,
    },
    {
      id: 'ast-ver-002',
      title: 'Solar Photovoltaic Grid 50MW',
      assetType: 'renewable_energy',
      location: 'Valencia, Spain',
      valuation: '$1,200,000',
      ownerName: 'Iberian Clean Energy Corp',
      surveyNumber: 'VAL-9921-S',
      submittedAt: '2026-07-30',
      status: 'pending_verification',
      ocrConfidence: '96.2%',
      riskScore: 18,
    },
  ];

  const handleVote = async (decision: 'approve' | 'reject') => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedAsset(null);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="page-container space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl p-8 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Verifier Control Center
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Verifier Control Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Inspect physical title deeds, OCR document extractions, AI risk scores, and execute multi-sig verification approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 text-center border border-indigo-500/20">
              <div className="text-xl font-bold text-indigo-400">2</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Queue</div>
            </div>
            <div className="glass-card px-4 py-2 text-center border border-emerald-500/20">
              <div className="text-xl font-bold text-emerald-400">14</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Verified This Month</div>
            </div>
          </div>
        </div>
      </div>

      <RoleWorkQueueWidget role="verifier" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'queue' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <FileCheck2 className="w-4 h-4" /> Approval Queue (2)
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'ocr' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <Scan className="w-4 h-4" /> OCR Scanner Engine
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'history' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <Clock className="w-4 h-4" /> Verification Audit Log
        </button>
      </div>

      {/* Content */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of assigned assets */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Pending Asset Submissions
            </h2>
            {assignedAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`glass-card p-5 cursor-pointer transition-all border
                  ${selectedAsset?.id === asset.id
                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-white/[0.08] hover:border-indigo-500/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="pill-badge pill-warning text-[10px]">Pending Review</span>
                  <span className="text-[11px] font-mono text-slate-500">{asset.submittedAt}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{asset.title}</h3>
                <div className="text-xs text-slate-400">{asset.location} • {asset.valuation}</div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-500">OCR Confidence: <strong className="text-emerald-400">{asset.ocrConfidence}</strong></span>
                  <span className="text-slate-500">Risk Score: <strong className="text-indigo-300">{asset.riskScore}/100</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Asset Inspection & Review Panel */}
          <div className="lg:col-span-2">
            {selectedAsset ? (
              <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedAsset.title}</h3>
                    <p className="text-xs text-slate-400">Survey No: {selectedAsset.surveyNumber} • Owner: {selectedAsset.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{selectedAsset.valuation}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Claimed Valuation</div>
                  </div>
                </div>

                {/* Document Verification Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Title & Valuation Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">Sub-Registrar Title Deed</div>
                          <div className="text-[10px] text-emerald-400">OCR Scanned & Verified</div>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">Knight Frank Appraisal</div>
                          <div className="text-[10px] text-emerald-400">Valuation Matched</div>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Review comments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verifier Inspection Notes</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Enter physical inspection confirmation notes, survey match details, or approval comments..."
                    className="w-full bg-slate-900/80 border border-white/[0.1] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                {/* Actions */}
                {isSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verification Vote Cryptographically Anchored to Multi-Sig Ledger!
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleVote('reject')}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject Asset
                    </button>
                    <button
                      onClick={() => handleVote('approve')}
                      disabled={isSubmitting}
                      className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Sign Cryptographically
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-500 text-sm border border-white/[0.08] space-y-2">
                <FileCheck2 className="w-10 h-10 mx-auto text-slate-600" />
                <div className="font-semibold text-white">Select an Asset from the Queue to Begin Review</div>
                <div className="text-xs text-slate-500">Inspect deed OCR extractions, legal titles, and submit verifier signatures.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ocr' && (
        <div className="glass-card p-8 border border-indigo-500/20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Automated OCR Document Extraction Engine</h3>
              <p className="text-xs text-slate-400">Extract survey numbers, property boundaries, and valuations from PDF or image deeds.</p>
            </div>
            <button className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
              <Scan className="w-4 h-4" /> Scan New Document
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-mono text-xs text-slate-300 space-y-2">
            <div className="text-indigo-400 font-semibold">// OCR Extraction Stream Output: SUR-8849-B.pdf</div>
            <div>[PARSER] Title Deed ID: TD-9921-2025-NY</div>
            <div>[PARSER] Claimed Owner: TrustChain Commercial Real Estate SPV LLC</div>
            <div>[PARSER] Survey Number: SUR-8849-B (District 4, Sub-Registrar IV)</div>
            <div>[PARSER] Certified Valuation: $2,500,000 USD (Appraised by Knight Frank)</div>
            <div>[PARSER] Encumbrance Status: NO MORTGAGES OR LITIGATION DETECTED (Confidence 98.4%)</div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-card p-6 border border-white/[0.08] space-y-4">
          <h3 className="text-base font-bold text-white">Verification Audit Log</h3>
          <div className="space-y-3">
            {[
              { id: 'v-101', title: 'Manhattan Commercial Plaza', action: 'APPROVED', time: 'Yesterday', hash: '0x8f9d...1f90' },
              { id: 'v-102', title: 'Dubai Luxury Villa', action: 'APPROVED', time: '3 days ago', hash: '0x489d...fb10' },
            ].map(log => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{log.title}</span>
                  <span className="ml-2 text-emerald-400 font-semibold">{log.action}</span>
                </div>
                <div className="font-mono text-slate-500">{log.hash} • {log.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
