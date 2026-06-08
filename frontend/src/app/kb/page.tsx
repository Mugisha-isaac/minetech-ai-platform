'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { listKbDocuments } from '@/lib/api';
import {
  Upload, Database, Loader2, FileText, CheckCircle,
  AlertCircle, Trash2, FileType, X
} from 'lucide-react';

type KbDoc = { id: number; title: string; filename: string; createdAt: string };

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const ACCEPTED = ['.pdf', '.txt', '.md', '.docx'];
const ACCEPTED_MIME = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function fileIcon(filename: string) {
  if (!filename) return <FileText size={14} className="text-mine-400" />;
  if (filename.endsWith('.pdf'))  return <span className="text-red-400 text-xs font-mono font-bold">PDF</span>;
  if (filename.endsWith('.docx')) return <span className="text-blue-400 text-xs font-mono font-bold">DOC</span>;
  if (filename.endsWith('.md'))   return <span className="text-purple-400 text-xs font-mono font-bold">MD</span>;
  return <span className="text-slate-400 text-xs font-mono font-bold">TXT</span>;
}

export default function KbPage() {
  const [docs,       setDocs]       = useState<KbDoc[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [dragOver,   setDragOver]   = useState(false);

  // File upload state
  const [file,       setFile]       = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  // Paste mode
  const [mode,       setMode]       = useState<'file' | 'paste'>('file');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try { setDocs(await listKbDocuments()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  function pickFile(f: File) {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext) && !ACCEPTED_MIME.includes(f.type)) {
      setError(`Unsupported file type. Accepted: ${ACCEPTED.join(', ')}`);
      return;
    }
    setFile(f);
    setError('');
    // Auto-fill title from filename
    if (!customTitle) {
      setCustomTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
    }
  }

  // ── File upload ────────────────────────────────────────────────────────────
  async function handleFileUpload() {
    if (!file) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (customTitle.trim()) form.append('title', customTitle.trim());

      const res = await fetch(`${API}/api/chat/kb/upload`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      const data = await res.json();
      setSuccess(`"${data.title}" uploaded and embedded successfully.`);
      setFile(null); setCustomTitle('');
      await loadDocs();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  // ── Paste upload ───────────────────────────────────────────────────────────
  async function handlePasteUpload() {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/chat/kb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pasteTitle.trim(), content: pasteContent.trim() }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setSuccess(`"${data.title}" added and embedded successfully.`);
      setPasteTitle(''); setPasteContent('');
      await loadDocs();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await fetch(`${API}/api/chat/kb/${id}`, { method: 'DELETE' });
      setDocs(d => d.filter(x => x.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="flex-1 p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-xs text-mine-400 tracking-widest uppercase mb-1">RAG Data Source</p>
        <h1 className="font-display text-3xl text-slate-100">Knowledge Base</h1>
        <p className="text-slate-400 mt-1 text-sm">Upload documents the Knowledge AI will use to answer questions. Supports PDF, DOCX, TXT, and Markdown.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        {(['file', 'paste'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? 'bg-mine-300/10 border border-mine-300/30 text-mine-200'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}>
            {m === 'file' ? '📎 Upload File' : '📋 Paste Text'}
          </button>
        ))}
      </div>

      {/* Upload card */}
      <div className="card p-6 mb-8">

        {mode === 'file' ? (
          <>
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mb-4 ${
                dragOver
                  ? 'border-mine-300 bg-mine-300/5'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-mine-700/40 hover:border-mine-500/40'
              }`}>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="hidden"
                onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileType size={20} className="text-emerald-400" />
                  <div className="text-left">
                    <p className="text-slate-200 text-sm font-medium">{file.name}</p>
                    <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setCustomTitle(''); }}
                    className="ml-2 text-slate-500 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={28} className="text-mine-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Drag & drop or click to select</p>
                  <p className="text-slate-600 text-xs mt-1">PDF · DOCX · TXT · Markdown — up to 50 MB</p>
                </>
              )}
            </div>

            {/* Optional title override */}
            <input
              className="input-gold text-sm mb-4"
              placeholder="Document title (auto-filled from filename)"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
            />

            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3">
                <CheckCircle size={14} /> {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              className="btn-gold flex items-center gap-2"
              onClick={handleFileUpload}
              disabled={uploading || !file}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Uploading & embedding...' : 'Upload & Embed'}
            </button>
          </>
        ) : (
          <>
            <input
              className="input-gold mb-3 text-sm"
              placeholder="Document title (e.g. Safety Policy v2.1)"
              value={pasteTitle}
              onChange={e => setPasteTitle(e.target.value)}
            />
            <textarea
              className="input-gold text-sm resize-none h-44 mb-3"
              placeholder="Paste document content here..."
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
            />
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3">
                <CheckCircle size={14} /> {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <button
              className="btn-gold flex items-center gap-2"
              onClick={handlePasteUpload}
              disabled={uploading || !pasteTitle.trim() || !pasteContent.trim()}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Embedding...' : 'Upload & Embed'}
            </button>
          </>
        )}
      </div>

      {/* Documents list */}
      <div>
        <h2 className="font-display text-lg text-slate-100 mb-4 flex items-center gap-2">
          <Database size={16} className="text-mine-300" />
          Indexed Documents
          <span className="text-slate-500 text-sm font-body font-normal ml-1">({docs.length})</span>
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-6">
            <Loader2 size={15} className="animate-spin" /> Loading...
          </div>
        ) : docs.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">
            No documents yet. Upload one above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="card p-4 flex items-center gap-3 group">
                <div className="w-8 flex items-center justify-center shrink-0">
                  {fileIcon(d.filename)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{d.title}</p>
                  {d.filename && (
                    <p className="text-slate-500 text-xs font-mono truncate">{d.filename}</p>
                  )}
                </div>
                <p className="text-slate-600 text-xs font-mono shrink-0">
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDelete(d.id, d.title)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all ml-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}