import { useState, useRef, useEffect } from "react";
import { trpc } from "../lib/trpc";

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Hi! 👋 I'm the CB Travel assistant. How can I help you today?" }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: settings } = trpc.settings.getPublic.useQuery();
  const askMutation = trpc.ai.askFaq.useMutation({
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    },
  });

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!settings?.ai_features_enabled) return null;

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    askMutation.mutate({ question: input, conversationHistory: messages.map(m => ({ role: m.role, content: m.content })) });
    setInput("");
  };

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-[#1e3a5f] rounded-full shadow-lg hover:bg-[#2d5986] transition-all hover:scale-110"
        aria-label="Open AI Chat Assistant">
        {open
          ? <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        }
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#e8b84b] rounded-full animate-pulse" />}
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: '420px' }}>
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] p-4 text-white">
            <p className="font-semibold">CB Travel Assistant 🤖</p>
            <p className="text-xs text-blue-200">Powered by AI · Available 24/7</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-3 py-2">
                  <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.15}s`}} />)}</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask me anything..." className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              <button onClick={sendMessage} disabled={!input.trim() || askMutation.isPending}
                className="bg-[#1e3a5f] text-white px-3 py-2 rounded-xl hover:bg-[#2d5986] transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
