import Link from 'next/link';
import { AlertTriangle, MessageSquare, Cpu, Database, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 p-12">
      <div className="max-w-5xl">
        {/* Header Section */}
        <div className="mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-mine-300/10 border border-mine-300/30 rounded-full">
            <Zap size={14} className="text-mine-300" />
            <p className="text-mine-300 font-mono text-xs tracking-widest uppercase">
              Mining Operations Intelligence
            </p>
          </div>
          <h1 className="font-display text-5xl text-slate-100 mb-4 leading-tight">
            MineTech AI Platform
          </h1>
          <p className="text-slate-300 text-xl mb-2 leading-relaxed max-w-2xl">
            Self-hosted AI for smart intake triage and grounded knowledge retrieval — built for compliance-critical mining workflows.
          </p>
          <p className="text-slate-500 text-sm font-mono">
            Enterprise-grade LLM infrastructure. Zero external dependencies.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <Link href="/triage" className="group">
            <div className="card p-8 h-full hover:shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-mine-300/20 to-mine-400/10 border border-mine-300/30 flex items-center justify-center group-hover:border-mine-300/60 transition-colors">
                  <AlertTriangle size={20} className="text-mine-300" />
                </div>
                <Zap size={16} className="text-mine-300/0 group-hover:text-mine-300 transition-colors" />
              </div>
              <h2 className="font-display text-2xl text-slate-100 mb-3 group-hover:text-mine-200 transition-colors">
                Smart Triage
              </h2>
              <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">
                Paste any support ticket or incident report. The AI classifies, extracts fields, and drafts a reply — structured JSON every time.
              </p>
              <div className="mt-6 flex items-center gap-2 text-mine-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold">Explore</span>
                <span className="text-xs">→</span>
              </div>
            </div>
          </Link>

          <Link href="/chat" className="group">
            <div className="card p-8 h-full hover:shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-mine-300/20 to-mine-400/10 border border-mine-300/30 flex items-center justify-center group-hover:border-mine-300/60 transition-colors">
                  <MessageSquare size={20} className="text-mine-300" />
                </div>
                <Shield size={16} className="text-mine-300/0 group-hover:text-mine-300 transition-colors" />
              </div>
              <h2 className="font-display text-2xl text-slate-100 mb-3 group-hover:text-mine-200 transition-colors">
                Knowledge AI
              </h2>
              <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">
                Ask questions grounded in your uploaded documents. Answers come with citations. Hallucinations are blocked by design.
              </p>
              <div className="mt-6 flex items-center gap-2 text-mine-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold">Explore</span>
                <span className="text-xs">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tech Stack Footer */}
        <div className="card p-6 border border-mine-300/20">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-mine-300/10 border border-mine-300/30 flex items-center justify-center">
                <Cpu size={14} className="text-mine-300" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono">LLM</p>
                <p className="text-sm font-semibold text-slate-100">qwen2.5:1.5b</p>
              </div>
            </div>
            
            <div className="w-px h-8 bg-mine-300/10" />
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-mine-300/10 border border-mine-300/30 flex items-center justify-center">
                <Database size={14} className="text-mine-300" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono">Database</p>
                <p className="text-sm font-semibold text-slate-100">PostgreSQL + pgvector</p>
              </div>
            </div>
            
            <div className="w-px h-8 bg-mine-300/10" />
            
            <div className="ml-auto flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs text-emerald-400 font-mono font-semibold">SELF-HOSTED</p>
                <p className="text-xs text-emerald-400/70">Zero API cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
