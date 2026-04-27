import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Send, Plus, Trash2, MessageSquare, Edit2, Check, X, Bot, User, Loader2,
  TrendingUp, Calendar, AlertCircle,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Summarise the most urgent things on my plate today.",
  "Draft a friendly chase-up email for clients with an outstanding balance.",
  "Which clients should I prioritise calling this week and why?",
  "Suggest 3 social posts based on our most popular destinations this quarter.",
  "Write a luxury Instagram caption for our most expensive active deal.",
  "What patterns do you see in recent quote requests?",
];

export default function AdminAIAssistant() {
  const utils = trpc.useUtils();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationsQ = trpc.aiAssistant.listConversations.useQuery();
  const messagesQ = trpc.aiAssistant.getConversation.useQuery(
    { id: activeId! },
    { enabled: activeId !== null }
  );
  const snapshotQ = trpc.aiAssistant.snapshot.useQuery();

  const createConv = trpc.aiAssistant.createConversation.useMutation({
    onSuccess: ({ id }) => { 
      setActiveId(id); 
      utils.aiAssistant.listConversations.invalidate();
      // Invalidate the messages query for the new conversation to ensure fresh fetch
      utils.aiAssistant.getConversation.invalidate({ id });
    },
  });
  const renameConv = trpc.aiAssistant.renameConversation.useMutation({
    onSuccess: () => { utils.aiAssistant.listConversations.invalidate(); setRenamingId(null); },
  });
  const deleteConv = trpc.aiAssistant.deleteConversation.useMutation({
    onSuccess: () => { utils.aiAssistant.listConversations.invalidate(); setActiveId(null); },
  });
  const sendMsg = trpc.aiAssistant.sendMessage.useMutation({
    onSuccess: () => { utils.aiAssistant.getConversation.invalidate({ id: activeId! }); utils.aiAssistant.listConversations.invalidate(); setInput(""); },
    onError: (e) => toast.error(e.message),
  });

  const conversations = conversationsQ.data || [];
  const messages = messagesQ.data || [];
  const snap = snapshotQ.data;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, sendMsg.isPending]);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message) return;
    let convId = activeId;
    if (convId === null) {
      const r = await createConv.mutateAsync({});
      convId = r.id;
      setActiveId(convId);
    }
    sendMsg.mutate({ conversationId: convId!, message });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      {/* Sidebar */}
      <aside className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <Button onClick={() => createConv.mutate({})} className="w-full bg-navy-gradient text-white hover:opacity-90">
            <Plus size={16} className="mr-2" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 text-center">No chats yet</p>
          )}
          {conversations.map((c: any) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm mb-1 ${
                activeId === c.id ? "bg-amber-50 border border-amber-200" : "hover:bg-muted/50"
              }`}
              onClick={() => setActiveId(c.id)}
            >
              <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
              {renamingId === c.id ? (
                <>
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") renameConv.mutate({ id: c.id, title: renameValue }); if (e.key === "Escape") setRenamingId(null); }}
                    className="h-7 text-xs"
                  />
                  <button onClick={(e) => { e.stopPropagation(); renameConv.mutate({ id: c.id, title: renameValue }); }} className="text-emerald-600"><Check size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="text-muted-foreground"><X size={14} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingId(c.id); setRenameValue(c.title); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                  ><Edit2 size={12} /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this conversation?")) deleteConv.mutate({ id: c.id }); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600"
                  ><Trash2 size={12} /></button>
                </>
              )}
            </div>
          ))}
        </div>
        {snap && (
          <div className="p-3 border-t border-border bg-muted/30 text-xs space-y-1.5">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Live snapshot</p>
            <div className="flex items-center gap-2"><Calendar size={11} className="text-amber-600" /><span>{snap.upcomingDepartures.length} upcoming departures</span></div>
            <div className="flex items-center gap-2"><AlertCircle size={11} className="text-orange-600" /><span>{snap.outstandingBalances.length} outstanding balances</span></div>
            <div className="flex items-center gap-2"><TrendingUp size={11} className="text-emerald-600" /><span>{snap.totals.openQuotes} open quotes</span></div>
          </div>
        )}
      </aside>

      {/* Chat */}
      <main className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
        <header className="p-5 border-b border-border bg-gradient-to-r from-amber-50/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-gradient flex items-center justify-center">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                AI Admin Assistant
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">GROQ</Badge>
              </h2>
              <p className="text-xs text-muted-foreground">Knows your bookings, clients, deals & quotes. Ask anything.</p>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-navy-gradient mx-auto mb-4 flex items-center justify-center">
                <Sparkles size={22} className="text-amber-300" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-gold-gradient">How can I help today?</h3>
              <p className="text-sm text-muted-foreground mb-6">Try one of these to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-left text-sm p-3 rounded-xl border border-border hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  >{p}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-navy-gradient flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-amber-300" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-navy-gradient text-white"
                  : "bg-muted/50 text-foreground border border-border"
              }`}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-amber-700" />
                </div>
              )}
            </div>
          ))}

          {sendMsg.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-gradient flex items-center justify-center shrink-0">
                <Bot size={14} className="text-amber-300" />
              </div>
              <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything about your business — or have me draft a client email…"
              rows={2}
              className="resize-none"
              disabled={sendMsg.isPending}
            />
            <Button
              onClick={() => handleSend()}
              disabled={sendMsg.isPending || !input.trim()}
              className="bg-navy-gradient text-white self-end"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">⚠️ Drafts only — review every client-facing message before sending.</p>
        </footer>
      </main>
    </div>
  );
}
