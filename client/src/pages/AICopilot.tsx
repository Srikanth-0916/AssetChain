import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, Bot, User, TrendingUp, BarChart3,
  Shield, Globe, Vote, FileText, RefreshCw, ChevronDown,
  AlertCircle, Lightbulb, Target, Zap, Trash2, Settings,
  CheckCircle2, Info, BookOpen,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderMarkdownish(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 6px;border-radius:4px;font-size:11px;color:#a5b4fc">$1</code>');
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{pct}% confidence</span>
    </div>
  );
}

// ─── AI Response Card ─────────────────────────────────────────────────────────

function AIResponseCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-3 text-xs">
      {/* Confidence meter — Module 9 */}
      {typeof data.confidence === 'number' && (
        <ConfidenceMeter value={data.confidence} />
      )}

      {data.summary && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Summary
          </div>
          <p className="text-slate-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Evidence panel — Module 9 */}
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

      {/* Reasons — Module 9 */}
      {data.reasons && data.reasons.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1.5">
            <Info className="w-3.5 h-3.5" /> Reasoning
          </div>
          <ul className="space-y-1">
            {data.reasons.map((r: string, i: number) => (
              <li key={i} className="text-slate-400 flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Target className="w-3.5 h-3.5" /> Recommendations
          </div>
          {data.recommendations.map((rec: any, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-semibold text-white">{rec.assetName}</div>
              <div className="text-slate-400 mt-1 space-y-0.5">
                <div>Tokens: <span className="text-white">{rec.tokensToConsider}</span> | Cost: <span className="text-emerald-400">${rec.estimatedCost?.toLocaleString()}</span></div>
                <div>ROI: <span className="text-emerald-400">{rec.expectedROI}</span> | Risk: <span className="text-amber-400">{rec.riskLevel}</span></div>
                <div className="text-slate-300 mt-1">{rec.reason}</div>
                {rec.evidence && rec.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {rec.evidence.map((e: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px]">{e}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.riskFactors && (
        <div className="space-y-2">
          {data.riskFactors.map((rf: any, i: number) => (
            <div key={i} className={`p-2.5 rounded-lg border text-xs ${
              rf.severity === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
              rf.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              <span className="font-semibold">{rf.factor}:</span> {rf.explanation}
              {rf.evidence && rf.evidence.length > 0 && (
                <div className="mt-1 text-[10px] opacity-70">{rf.evidence.join(' · ')}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Zap className="w-3.5 h-3.5" /> AI Suggestions
          </div>
          {data.suggestions.map((s: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                s.priority === 'High' ? 'bg-red-500/20 text-red-300' :
                s.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
              }`}>{s.priority}</span>
              <div>
                <div className="font-semibold text-white">{s.action}</div>
                <div className="text-slate-400">{s.reason}</div>
                {s.evidence && s.evidence.length > 0 && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.evidence.join(' · ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives — Module 9 */}
      {(data.alternativeAssets || data.alternativeStrategies || data.alternativeConsiderations) && (
        <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
          <div className="text-purple-300 font-semibold mb-1">Alternatives to Consider</div>
          {[
            ...(data.alternativeAssets || []),
            ...(data.alternativeStrategies || []),
            ...(data.alternativeConsiderations || []),
          ].map((alt: string, i: number) => (
            <div key={i} className="text-slate-400 flex items-start gap-2">
              <span className="text-purple-400">◆</span>{alt}
            </div>
          ))}
        </div>
      )}

      {data.warnings && data.warnings.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Warnings
          </div>
          {data.warnings.map((w: string, i: number) => (
            <div key={i} className="text-red-300 text-xs flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>{w}
            </div>
          ))}
        </div>
      )}

      {data.disclaimer && (
        <p className="text-slate-500 text-[10px] italic border-t border-slate-800 pt-2">{data.disclaimer}</p>
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
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load history on mount ─────────────────────────────────────────────────
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

        // Also load preferences
        const prefsRes = await api.get('/ai/preferences');
        const prefs = prefsRes.data?.data;
        if (prefs) {
          setBudget(prefs.budget || 10000);
          setRiskLevel(prefs.riskPreference || 'medium');
        }
      } catch {
        // Silently ignore — first visit
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Message helpers ───────────────────────────────────────────────────────
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

  // ── Save preferences ──────────────────────────────────────────────────────
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

  // ── Clear history ─────────────────────────────────────────────────────────
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

  // ── Quick prompts ─────────────────────────────────────────────────────────
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
    const lower = trimmed.toLowerCase();
    const loadingId = addLoadingMessage();
    setIsLoading(true);
    try {
      let result: any;
      let responseText = '';
      if (lower.includes('invest') || lower.includes('buy') || lower.includes('recommend')) {
        result = await aiService.getInvestmentAdvice(budget, riskLevel);
        responseText = '**Investment Recommendations** based on your profile:';
      } else if (lower.includes('portfolio') || lower.includes('holdings') || lower.includes('diversif')) {
        result = await aiService.analyzePortfolio();
        responseText = '**Portfolio Intelligence** analysis:';
      } else if (lower.includes('market') || lower.includes('trend')) {
        result = await aiService.getMarketInsights();
        responseText = '**Market Insights** and trends:';
      } else if (lower.includes('risk') || lower.includes('safe')) {
        result = await aiService.analyzeRisk('asset-demo-uuid-001');
        responseText = '**Risk Analysis** for the top marketplace asset:';
      } else if (lower.includes('dao') || lower.includes('vote') || lower.includes('proposal')) {
        result = await aiService.daoAssistant('prop-demo-uuid-001');
        responseText = '**DAO Governance** analysis:';
      } else {
        result = await aiService.getMarketInsights();
        responseText = `Analyzing your question about **"${trimmed}"** — here are the relevant insights:`;
      }
      removeLoadingMessage(loadingId);
      addMessage('assistant', responseText, result);
    } catch (err: any) {
      removeLoadingMessage(loadingId);
      addMessage('assistant', `Error: ${err?.message || 'Please try again. Make sure you are logged in.'}`);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 h-[calc(100vh-120px)] flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TrustChain AI Copilot</h1>
            <p className="text-[11px] text-slate-400">Remembers your preferences · Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <p className="text-[10px] text-slate-500 self-center">Preferences are saved to your AI memory and persist across sessions.</p>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`flex-1 max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    <span className="text-slate-400">Thinking with memory context...</span>
                  </div>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: renderMarkdownish(msg.content) }} />
                )}
              </div>
              {msg.data && !msg.isLoading && (
                <div className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 rounded-tl-sm">
                  <AIResponseCard data={msg.data} />
                </div>
              )}
              <span className="text-[10px] text-slate-600">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask anything — investment advice, risk analysis, DAO guidance, market trends..."
          disabled={isLoading}
          className="input-field flex-1 text-xs"
        />
        <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="btn-primary px-4 py-2.5 text-xs flex-shrink-0">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
