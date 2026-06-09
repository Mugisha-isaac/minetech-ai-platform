const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const API  = `${BASE}/api`;


export async function submitTriage(text: string) {
  const res = await fetch(`${API}/triage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getTickets(category?: string, priority?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (priority) params.set('priority', priority);
  const res = await fetch(`${API}/triage?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API}/triage/categories`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


export async function sendChatMessage(message: string, sessionId?: string) {
  const res = await fetch(`${API}/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, sessionId: sessionId ?? null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getChatHistory(sessionId: string) {
  const res = await fetch(`${API}/chat/sessions/${sessionId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadKbDocument(title: string, content: string) {
  const res = await fetch(`${API}/chat/kb`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listKbDocuments() {
  const res = await fetch(`${API}/chat/kb`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
