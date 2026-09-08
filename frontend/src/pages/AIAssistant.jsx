import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/common/Icon';
import { api } from '../api/client';

const SUGGESTIONS = [
  'Why is this area hot?',
  "What should I do if I feel dizzy from heat?",
  'How does the route avoid heat?',
  'How accurate are the cost estimates?',
];

export function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the HeatScape 360 assistant. Ask me about heat risk, routes, safety steps, or cost estimates." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setInput('');
    setSending(true);
    try {
      const r = await api.assistant(msg, history);
      setMessages((m) => [...m, { role: 'assistant', content: r.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: "Sorry, I couldn't reach the assistant service just now. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="AI Assistant" subtitle="Ask about heat risk, routes or safety" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 space-y-3 pb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] md:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-brand-700 text-white rounded-br-sm' : 'bg-white text-brand-950/90 shadow-card rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white shadow-card rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-brand-950/40">Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 md:px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 text-xs font-medium bg-white shadow-card rounded-full px-3 py-2 text-brand-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 bg-white rounded-xl shadow-card px-3 py-2"
        >
          <input
            className="flex-1 text-sm outline-none placeholder:text-brand-950/40"
            placeholder="Ask about heat risk, routes, or safety…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim() || sending} className="h-8 w-8 rounded-full bg-brand-700 text-white flex items-center justify-center disabled:opacity-40">
            <Icon name="chevronRight" size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
