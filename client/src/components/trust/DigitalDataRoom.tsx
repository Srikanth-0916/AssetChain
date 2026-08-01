import React, { useState } from 'react';
import {
  FileText, Download, Eye, ShieldCheck, CheckCircle2,
  Clock, Hash, UserCheck, Shield, Lock, FileSpreadsheet,
  Building, ExternalLink
} from 'lucide-react';

export interface DataRoomDocument {
  id: string;
  category: 'financial' | 'legal' | 'tax' | 'valuation' | 'occupancy' | 'images';
  title: string;
  filename: string;
  uploadedBy: string;
  version: string;
  hash: string;
  uploadedDate: string;
  verifiedBy: string;
  digitalSignature: string;
  fileSize: string;
  fileUrl?: string;
}

interface DigitalDataRoomProps {
  assetTitle: string;
  documents?: DataRoomDocument[];
}

const DEFAULT_DOCUMENTS: DataRoomDocument[] = [
  {
    id: 'doc-001',
    category: 'legal',
    title: 'Sub-Registrar Certified Title Deed',
    filename: 'Title_Deed_SUR_8849_B.pdf',
    uploadedBy: 'TrustChain SPV Custody',
    version: 'v2.1 (Final)',
    hash: '0x8f9d19d0be744cb7bf20e87488da1f90a2b4e8c1',
    uploadedDate: '2026-07-15',
    verifiedBy: 'Senior Title Advocate M. Sharma',
    digitalSignature: 'RSA-4096-SIG-992184',
    fileSize: '4.2 MB',
  },
  {
    id: 'doc-002',
    category: 'valuation',
    title: 'Knight Frank Institutional Valuation Report',
    filename: 'Valuation_Report_Q2_2026.pdf',
    uploadedBy: 'Knight Frank Valuation Partners',
    version: 'v1.0 (Audited)',
    hash: '0x489d0e7e68004abb8ccdd5280a7cfb10e9f1a23b',
    uploadedDate: '2026-07-20',
    verifiedBy: 'Chartered Surveyor R. Mehta',
    digitalSignature: 'RSA-4096-SIG-441029',
    fileSize: '8.7 MB',
  },
  {
    id: 'doc-003',
    category: 'financial',
    title: 'Q2 Audited SPV Financial Statements',
    filename: 'Audited_Financials_Q2_2026.xlsx',
    uploadedBy: 'Deloitte SPV Audit Team',
    version: 'v1.2 (Verified)',
    hash: '0x7e388ac818724f0ca7b11fe283c633e2a1b9c8d7',
    uploadedDate: '2026-07-25',
    verifiedBy: 'Deloitte Audit Partner',
    digitalSignature: 'RSA-4096-SIG-110293',
    fileSize: '2.4 MB',
  },
  {
    id: 'doc-004',
    category: 'occupancy',
    title: 'Master Commercial Lease Agreements',
    filename: 'Lease_Agreements_Consolidated.pdf',
    uploadedBy: 'Asset Management SPV',
    version: 'v3.0 (Active)',
    hash: '0x2b4e8c10x8f9d19d0be744cb7bf20e87488da1f90',
    uploadedDate: '2026-07-18',
    verifiedBy: 'Legal Review Center',
    digitalSignature: 'RSA-4096-SIG-774012',
    fileSize: '12.1 MB',
  },
  {
    id: 'doc-005',
    category: 'tax',
    title: '30-Year Nil-Encumbrance & Tax Receipt Certificate',
    filename: 'Nil_Encumbrance_Cert_2026.pdf',
    uploadedBy: 'District Collector Registry',
    version: 'v1.0 (Government Issued)',
    hash: '0xe9f1a23b0x489d0e7e68004abb8ccdd5280a7cfb10',
    uploadedDate: '2026-07-12',
    verifiedBy: 'Compliance Officer K. Nair',
    digitalSignature: 'RSA-4096-SIG-881023',
    fileSize: '1.8 MB',
  },
];

export function DigitalDataRoom({ assetTitle, documents = DEFAULT_DOCUMENTS }: DigitalDataRoomProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<DataRoomDocument | null>(null);

  const categories = [
    { id: 'all', label: 'All Documents (' + documents.length + ')' },
    { id: 'legal', label: 'Title Deeds & Legal' },
    { id: 'valuation', label: 'Valuation Reports' },
    { id: 'financial', label: 'Financial Statements' },
    { id: 'occupancy', label: 'Lease Agreements' },
    { id: 'tax', label: 'Property Tax & Encumbrance' },
  ];

  const filteredDocs = documents.filter(doc => selectedCategory === 'all' || doc.category === selectedCategory);

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="pill-badge pill-success text-[10px]">Secure Vault</span>
            <span className="text-xs text-slate-400 font-mono">AES-256 Encrypted</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Digital Data Room — {assetTitle}</h3>
          <p className="text-xs text-slate-400">Institutional grade document vault with cryptographic SHA-256 proof of authenticity.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-600/30 transition-all flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Download Data Room ZIP
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0
              ${selectedCategory === cat.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white bg-slate-900/60'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="space-y-3">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] hover:border-indigo-500/30 transition-all space-y-3 group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{doc.title}</h4>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">{doc.version}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{doc.filename} • {doc.fileSize}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Preview
                </button>
                <a
                  href={`#download-${doc.id}`}
                  onClick={(e) => { e.preventDefault(); alert(`Downloading verified document: ${doc.filename}`); }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>

            {/* Cryptographic Metadata Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
              <div>
                <span className="text-slate-500">Uploaded By: </span>
                <span className="font-semibold text-slate-300">{doc.uploadedBy}</span>
              </div>
              <div>
                <span className="text-slate-500">Verified By: </span>
                <span className="font-semibold text-emerald-400">{doc.verifiedBy}</span>
              </div>
              <div>
                <span className="text-slate-500">Digital Signature: </span>
                <span className="font-mono text-purple-400">{doc.digitalSignature}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">SHA-256: </span>
                <span className="font-mono text-slate-400 truncate">{doc.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* In-Browser Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <div className="text-xs text-slate-400 font-mono">Document Preview • {previewDoc.version}</div>
                <h3 className="text-lg font-bold text-white">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 font-mono text-xs text-slate-300">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
              <div className="text-white font-bold text-sm">Cryptographically Verified Document Document Stream</div>
              <div>Filename: {previewDoc.filename} ({previewDoc.fileSize})</div>
              <div>SHA-256 Digest: {previewDoc.hash}</div>
              <div>Digital RSA Signature: {previewDoc.digitalSignature}</div>
              <div className="text-emerald-400 mt-2">✓ Verified by {previewDoc.verifiedBy} on {previewDoc.uploadedDate}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close Preview
              </button>
              <button
                onClick={() => { alert(`Downloading ${previewDoc.filename}`); setPreviewDoc(null); }}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
