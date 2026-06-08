'use client';
import { useState, useEffect, useCallback } from 'react';
import { submitTriage, getTickets, getCategories } from '@/lib/api';
import { Send, Loader2, AlertCircle, ChevronDown, Filter } from 'lucide-react';

type Ticket = {
  id: number; rawInput: string; category: string; priority: string;
  location: string; affectedSystem: string; summary: string;
  suggestedReply: string; status: string; parseError: string;
  createdAt: string;
};

const PRIORITIES = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const priorityClass: Record<string, string> = {
  CRITICAL: 'priority-critical', HIGH: 'priority-high',
  MEDIUM: 'priority-medium',    LOW: 'priority-low',
};
const statusClass: Record<string, string> = {
  PROCESSED: 'status-processed', PARSE_ERROR: 'status-error', PENDING: 'status-pending',
};

export default function TriagePage() {
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [tickets,     setTickets]     = useState<Ticket[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [catFilter,   setCatFilter]   = useState('');
  const [priFilter,   setPriFilter]   = useState('');
  const [expanded,    setExpanded]    = useState<number | null>(null);
  const [error,       setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        getTickets(catFilter || undefined, priFilter || undefined),
        getCategories(),
      ]);
      setTickets(t); setCategories(c);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [catFilter, priFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!input.trim()) return;
    setSubmitting(true); setError('');
    try {
      await submitTriage(input.trim());
      setInput('');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="flex-1 p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-xs text-mine-400 tracking-widest uppercase mb-1">Use Case 1</p>
        <h1 className="font-display text-3xl text-slate-100">Smart Intake Triage</h1>
        <p className="text-slate-400 mt-1 text-sm">Paste any unstructured incident report or support ticket below.</p>
      </div>

      {/* Input area */}
      <div className="card p-6 mb-8">
        <textarea
          className="input-gold resize-none h-32 text-sm mb-4"
          placeholder="e.g. Our conveyor belt at Zone 3 stopped working this morning. Motor seems burnt. 2 hours of lost production..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        {error && (
          <div className="error-message mb-4">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        <button className="btn-gold" onClick={handleSubmit} disabled={submitting || !input.trim()}>
          {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
          {submitting ? 'Analysing...' : 'Submit for Triage'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-mine-900/40 border border-mine-300/10 rounded-lg">
        <Filter size={16} className="text-mine-400 shrink-0" />
        <div className="flex gap-3 flex-1">
          <select className="input-gold-select text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-gold-select text-sm" value={priFilter} onChange={e => setPriFilter(e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All priorities'}</option>)}
          </select>
        </div>
        <div className="shrink-0 whitespace-nowrap">
          <span className="text-mine-300 text-sm font-semibold font-mono">{tickets.length}</span>
          <span className="text-slate-500 text-sm ml-1">ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading tickets...
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.length === 0 && (
            <div className="card p-8 text-center text-slate-500 text-sm">No tickets yet. Submit one above.</div>
          )}
          {tickets.map(t => (
            <div key={t.id} className="card overflow-hidden hover:shadow-lg transition-all">
              <button
                className="w-full text-left p-4 flex items-center gap-3 hover:bg-mine-800/30 transition-colors"
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                <span className={`text-xs font-mono font-semibold rounded-md ${priorityClass[t.priority] ?? ''}`}>
                  {t.priority ?? '—'}
                </span>
                <span className="text-mine-300 text-xs font-mono font-semibold border border-mine-300/30 px-2 py-1 rounded-md bg-mine-300/5">
                  {t.category ?? 'Uncategorised'}
                </span>
                <span className="flex-1 text-sm text-slate-300 truncate font-medium">{t.summary ?? t.rawInput.slice(0, 80)}</span>
                <span className={`text-xs font-mono font-semibold rounded-md ${statusClass[t.status] ?? ''}`}>{t.status}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-all ${expanded === t.id ? 'rotate-180' : ''}`} />
              </button>

              {expanded === t.id && (
                <div className="border-t border-mine-700/20 px-4 pb-4 pt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase font-mono tracking-wider">Location</p>
                    <p className="text-slate-300">{t.location ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase font-mono tracking-wider">Affected System</p>
                    <p className="text-slate-300">{t.affectedSystem ?? '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-mono tracking-wider">Original Input</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{t.rawInput}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-mono tracking-wider">Suggested Reply</p>
                    <p className="text-slate-300 leading-relaxed">{t.suggestedReply ?? '—'}</p>
                  </div>
                  {t.parseError && (
                    <div className="col-span-2">
                      <p className="text-red-400 text-xs font-mono">{t.parseError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
