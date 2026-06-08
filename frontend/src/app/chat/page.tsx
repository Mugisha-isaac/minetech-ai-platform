'use client';
import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/lib/api';
import { Send, Loader2, BookOpen, AlertCircle, FileText } from 'lucide-react';

type Citation = { documentTitle: string; chunkIndex: number; excerpt: string };
type Msg = {
  id?: number; role: 'USER' | 'ASSISTANT'; content: string;
  citations?: Citation[]; grounded?: boolean;
};

export default function ChatPage() {
  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [sessionId,  setSessionId]  = useState<string | undefined>();
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: 'USER', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput(''); setError(''); setLoading(true);

    try {
      const res = await sendChatMessage(userMsg.content, sessionId);
      setSessionId(res.sessionId);
      setMessages(m => [...m, {
        role: 'ASSISTANT',
        content: res.answer.content,
        citations: res.answer.citations,
        grounded: res.answer.grounded,
      }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-mine-700/20 px-8 py-4 flex items-center gap-3">
        <BookOpen size={18} className="text-mine-300" />
        <div>
          <h1 className="font-display text-xl text-slate-100">Knowledge Assistant</h1>
          <p className="text-slate-500 text-xs">Grounded answers with citations · RAG via pgvector</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ask anything about your knowledge base documents.</p>
            <p className="text-xs mt-1">e.g. "What PPE is required in processing areas?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${msg.role === 'USER'
              ? 'bg-mine-800/60 border border-mine-700/30 rounded-xl rounded-br-sm px-4 py-3'
              : 'space-y-2 w-full'}`}>

              {msg.role === 'USER' ? (
                <p className="text-sm text-slate-200">{msg.content}</p>
              ) : (
                <div className="card p-4">
                  {!msg.grounded && (
                    <div className="flex items-center gap-2 text-amber-400 text-xs mb-3 font-mono">
                      <AlertCircle size={13} />
                      Answer not found in knowledge base
                    </div>
                  )}
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-mine-700/20 space-y-2">
                      <p className="text-xs text-mine-400 font-mono uppercase tracking-wider">Sources</p>
                      {msg.citations.map((c, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-xs">
                          <FileText size={12} className="text-mine-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-mine-300 font-medium">{c.documentTitle}</span>
                            <span className="text-slate-500 ml-1">· §{c.chunkIndex}</span>
                            <p className="text-slate-500 mt-0.5 line-clamp-2">{c.excerpt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card p-4 flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin text-mine-400" />
              Retrieving context and generating answer...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-mine-300/10 px-8 py-5 bg-gradient-to-t from-mine-900/30 to-transparent">
        {error && (
          <div className="error-message mb-3">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            className="input-gold flex-1 resize-none h-12 text-sm py-3"
            placeholder="Ask a question about your documents... (Enter to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="btn-gold"
            onClick={send}
            disabled={loading || !input.trim()}
            title="Send message (Enter)">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
