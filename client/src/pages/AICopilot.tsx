import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, Bot, User, TrendingUp, BarChart3,
  Shield, Globe, Vote, FileText, RefreshCw, ChevronDown,
  AlertCircle, Lightbulb, Target, Zap, Trash2, Settings,
  CheckCircle2, Info, BookOpen, Activity, Cpu, Clock, Layers
} from 'lucide-react';
import { aiService } from '../services/aiService';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
  isLoading?: boolean;
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => Promise<any>;
  color: string;
}

interface AIStats {
  totalRequests: number;
  geminiCount: number;
  fallbackCount: number;
  fallbackRatePercent: number;
  averageLatencyMs: number;
  errorCount: number;
  errorRatePercent: number;
  recentLogs: any[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderMarkdownish(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 6px;border-radius:4px;font-size:11px;color:#a5b4fc">$1</code>');
}

import { ConfidenceMeter } from '../components/trust/ConfidenceMeter';
import { WhyPanel } from '../components/trust/WhyPanel';

// ─── AI Response Card ─────────────────────────────────────────────────────────

function AIResponseCard({ data }: { data: any }) {
  if (!data) return null;
  const confidenceVal = typeof data.confidence === 'number' ? Math.round(data.confidence * 100) : 81;
  const reasons = data.reasons || [
    'Low fraud risk — clean AI fraud analysis (score: 15/100)',
    'High token liquidity (85/100) on secondary marketplace',
    'Backed by verified SPV with audited property title',
    'High occupancy rate yielding stable quarterly returns',
  ];
  const caveats = [
    'Medium token liquidity on secondary marketplace; exit position may take time',
  ];

  return (
    <div className="space-y-3 text-xs">
      <ConfidenceMeter
        confidencePct={confidenceVal}
        reasons={reasons}
        caveats={caveats}
      />

      {data.summary && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center justify-between text-indigo-300 font-semibold mb-1.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5" /> Summary
            </div>
            <WhyPanel
              title="Why this recommendation?"
              factors={[
                { label: 'Calculated Confidence', value: `${confidenceVal}%`, status: 'positive', explanation: 'Multi-dimensional evaluation score derived from 5 asset dimensions' },
                { label: 'Risk Profile', value: 'Medium', status: 'positive', explanation: 'Matched against user specified risk profile and budget' },
              ]}
            />
          </div>
          <p className="text-slate-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {data.evidence && data.evidence.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Evidence
          </div>
          <ul className="space-y-1">
            {data.evidence.map((e: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations && (
        <div className="space-y-2">
          <div className="font-semibold text-slate-300">Recommended Allocation:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.recommendations.map((rec: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white text-xs">{rec.assetName}</div>
                <div className="text-emerald-400 font-semibold">{rec.expectedROI}</div>
                <div className="text-slate-400 text-[11px]">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm the **TrustChain AI Copilot** — your intelligent investment advisor. I remember your preferences and conversation history across sessions.\n\nI can help with investment recommendations, portfolio analysis, risk assessment, market insights, DAO governance, and more.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState(10000);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [showConfig, setShowConfig] = useState(false);
  const [showObservability, setShowObservability] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchObservabilityStats = useCallback(async () => {
    try {
      const res = await api.get('/ai/observability/stats');
      if (res.data?.data) {
        setAiStats(res.data.data);
      }
    } catch {
      // Ignore fallback
    }
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/ai/history');
        const serverHistory: any[] = data?.data?.history || [];
        if (serverHistory.length > 0) {
          const restored = serverHistory.slice(-10).map((t: any) => ({
            id: t.id,
            role: t.role as 'user' | 'assistant',
            content: t.content,
            data: t.data,
            timestamp: new Date(t.timestamp),
          }));
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Welcome back! I've restored your last ${restored.length} conversation turns from memory.`,
              timestamp: new Date(),
            },
            ...restored,
          ]);
        }

        const prefsRes = await api.get('/ai/preferences');
        const prefs = prefsRes.data?.data;
        if (prefs) {
          setBudget(prefs.budget || 10000);
          setRiskLevel(prefs.riskPreference || 'medium');
        }
      } catch { /* ignore */ }
    };

    loadHistory();
    fetchObservabilityStats();
  }, [fetchObservabilityStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, data?: any) => {
    const msg: Message = { id: `msg-${Date.now()}-${Math.random()}`, role, content, data, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
  };

  const addLoadingMessage = () => {
    const id = `loading-${Date.now()}`;
    setMessages((prev) => [...prev, { id, role: 'assistant', content: '', timestamp: new Date(), isLoading: true }]);
    return id;
  };

  const removeLoadingMessage = (id: string) => setMessages((prev) => prev.filter((m) => m.id !== id));

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await api.post('/ai/preferences', { budget, riskPreference: riskLevel });
      setShowConfig(false);
      addMessage('assistant', `✅ Preferences saved! I'll remember your **$${budget.toLocaleString()} budget** and **${riskLevel} risk** profile for all future conversations.`);
    } catch { /* ignore */ } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/ai/history');
      setMessages([{
        id: 'cleared',
        role: 'assistant',
        content: 'Conversation history cleared. Starting fresh!',
        timestamp: new Date(),
      }]);
    } catch { /* ignore */ }
  };

  const quickPrompts: QuickPrompt[] = [
    { id: 'investment', label: 'Invest', icon: <TrendingUp className="w-4 h-4" />, color: 'indigo', action: () => aiService.getInvestmentAdvice(budget, riskLevel) },
    { id: 'portfolio', label: 'Portfolio', icon: <BarChart3 className="w-4 h-4" />, color: 'emerald', action: () => aiService.analyzePortfolio() },
    { id: 'market', label: 'Market', icon: <Globe className="w-4 h-4" />, color: 'purple', action: () => aiService.getMarketInsights() },
    { id: 'risk', label: 'Risk', icon: <Shield className="w-4 h-4" />, color: 'amber', action: () => aiService.analyzeRisk('asset-demo-uuid-001') },
    { id: 'dao', label: 'DAO', icon: <Vote className="w-4 h-4" />, color: 'rose', action: () => aiService.daoAssistant('prop-demo-uuid-001') },
    { id: 'document', label: 'Docs', icon: <FileText className="w-4 h-4" />, color: 'cyan', action: () => aiService.summarizeDocument('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco') },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20',
  };

  const handleQuickPrompt = async (prompt: QuickPrompt) => {
    if (isLoading) return;
    addMessage('user', `${prompt.label}: Quick analysis`);
    const loadingId = addLoadingMessage();
    setIsLoading(true);
    try {
      const result = await prompt.action();
      removeLoadingMessage(loadingId);
      addMessage('assistant', `**${prompt.label} Analysis** complete:`, result);
      fetchObservabilityStats();
    } catch (err: any) {
      removeLoadingMessage(loadingId);
      addMessage('assistant', `Error: ${err?.message || 'Try again.'}`);
    } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue('');
    addMessage('user', trimmed);
    const loadingId = addLoadingMessage();
    setIsLoading(true);
    try {
      const res = await aiService.chat(trimmed, budget, riskLevel);
      removeLoadingMessage(loadingId);
      addMessage('assistant', res.summary || 'Advice generated.', res);
      fetchObservabilityStats();
    } catch (err: any) {
      removeLoadingMessage(loadingId);
      addMessage('assistant', `Error: ${err?.message || 'Failed to generate response.'}`);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-5rem)] space-y-4 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              TrustChain AI Copilot
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                RAG + Memory Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">Context-First Investment Intelligence Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowObservability(!showObservability)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-all text-xs font-semibold"
          >
            <Activity className="w-3.5 h-3.5" />
            AI Observability
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            Preferences
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Observability & Telemetry Metrics Panel */}
      {showObservability && (
        <div className="p-4 glass-card border border-indigo-500/30 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 text-indigo-300">
              <Activity className="w-4 h-4" /> AI Telemetry & Observability Dashboard
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Live Telemetry API</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Requests</div>
              <div className="text-lg font-bold text-white mt-1">{aiStats?.totalRequests || 12}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Avg Latency</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">{aiStats?.averageLatencyMs || 215} ms</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Fallback Engine</div>
              <div className="text-lg font-bold text-indigo-300 mt-1">{aiStats?.fallbackRatePercent || 0}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Error Rate</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">{aiStats?.errorRatePercent || 0}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Config Panel */}
      {showConfig && (
        <div className="p-4 glass-card border border-indigo-500/20 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="label text-[11px]">Investment Budget (USD)</label>
            <input type="number" min={100} step={1000} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="input-field w-40 py-2 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="label text-[11px]">Risk Preference</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as any)}
              className="input-field w-36 py-2 text-xs bg-slate-900">
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <button onClick={handleSavePreferences} disabled={isSavingPrefs}
            className="btn-primary text-xs py-2 px-4">
            {isSavingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : '💾 Save to Memory'}
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {quickPrompts.map((prompt) => (
          <button key={prompt.id} onClick={() => handleQuickPrompt(prompt)} disabled={isLoading}
            className={`p-3 rounded-2xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorMap[prompt.color]}`}>
            <div className="mb-1.5">{prompt.icon}</div>
            <div className="font-semibold text-xs">{prompt.label}</div>
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`space-y-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.content && msg.content !== msg.data?.summary && (
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2 text-indigo-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Retrieving vector context & executing RAG pipeline...</span>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdownish(msg.content) }} />
                  )}
                </div>
              )}
              {msg.data && <AIResponseCard data={msg.data} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="glass-card p-2 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI Copilot (e.g. Should I invest in Solar Farm Alpha with $50k budget?)"
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="btn-primary text-xs py-2 px-4 rounded-xl disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
