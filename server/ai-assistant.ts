// ─────────────────────────────────────────────────────────────────────────────
// server/ai-assistant.ts
// Admin-only AI assistant powered by GROQ. Has access to a curated, read-only
// snapshot of business data (recent bookings, clients, deals, quotes, support
// tickets) as system context — never raw tool calls into the DB.
// ─────────────────────────────────────────────────────────────────────────────

import { sql } from "drizzle-orm";
import { groqChat, type GroqMessage } from "./_groq";

// ─── Conversation persistence ───────────────────────────────────────────────

export async function createConversation(userId: number, title?: string): Promise<number> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.execute(sql`INSERT INTO aiAssistantConversations (userId, title) VALUES (${userId}, ${title || "New conversation"})`);
  return (result as any)[0]?.insertId as number;
}

export async function listConversations(userId: number): Promise<any[]> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT id, title, createdAt, updatedAt FROM aiAssistantConversations WHERE userId = ${userId} ORDER BY updatedAt DESC LIMIT 50`);
  return ((rows as any)[0] as any[]) || [];
}

export async function getMessages(conversationId: number): Promise<any[]> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT id, role, content, createdAt FROM aiAssistantMessages WHERE conversationId = ${conversationId} ORDER BY id ASC`);
  return ((rows as any)[0] as any[]) || [];
}

export async function appendMessage(conversationId: number, role: "user" | "assistant" | "system", content: string): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`INSERT INTO aiAssistantMessages (conversationId, role, content) VALUES (${conversationId}, ${role}, ${content})`);
  await db.execute(sql`UPDATE aiAssistantConversations SET updatedAt = NOW() WHERE id = ${conversationId}`);
}

export async function renameConversation(id: number, userId: number, title: string): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE aiAssistantConversations SET title = ${title} WHERE id = ${id} AND userId = ${userId}`);
}

export async function deleteConversation(id: number, userId: number): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`DELETE FROM aiAssistantMessages WHERE conversationId = ${id}`);
  await db.execute(sql`DELETE FROM aiAssistantConversations WHERE id = ${id} AND userId = ${userId}`);
}

// ─── Business data snapshot (for grounding) ─────────────────────────────────

export interface BusinessSnapshot {
  totals: { clients: number; bookings: number; activeDeals: number; openQuotes: number; openTickets: number; };
  recentBookings: Array<{ ref: string; client: string; destination: string; departure: string | null; status: string; total: number; paid: number }>;
  upcomingDepartures: Array<{ ref: string; client: string; destination: string; departure: string | null; }>;
  outstandingBalances: Array<{ ref: string; client: string; balance: number; departure: string | null }>;
  recentQuotes: Array<{ name: string; destination: string; status: string; createdAt: string }>;
  topDeals: Array<{ title: string; destination: string; price: number }>;
}

export async function buildBusinessSnapshot(): Promise<BusinessSnapshot> {
  const { getDb } = await import("./db");
  const db = await getDb();
  const empty: BusinessSnapshot = {
    totals: { clients: 0, bookings: 0, activeDeals: 0, openQuotes: 0, openTickets: 0 },
    recentBookings: [], upcomingDepartures: [], outstandingBalances: [], recentQuotes: [], topDeals: [],
  };
  if (!db) return empty;

  const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => { try { return await p; } catch { return fallback; } };
  const today = new Date().toISOString().slice(0, 10);

  const [
    clientCount, bookingCount, dealCount, quoteCount, ticketCount,
    recentBookings, upcoming, outstanding, recentQuotes, topDeals,
  ] = await Promise.all([
    safe(db.execute(sql`SELECT COUNT(*) AS c FROM users WHERE role = 'user'`), [[{ c: 0 }]] as any),
    safe(db.execute(sql`SELECT COUNT(*) AS c FROM bookings`), [[{ c: 0 }]] as any),
    safe(db.execute(sql`SELECT COUNT(*) AS c FROM deals WHERE isActive = TRUE`), [[{ c: 0 }]] as any),
    safe(db.execute(sql`SELECT COUNT(*) AS c FROM quoteRequests WHERE status IN ('new','contacted')`), [[{ c: 0 }]] as any),
    safe(db.execute(sql`SELECT COUNT(*) AS c FROM supportTickets WHERE status IN ('open','pending')`), [[{ c: 0 }]] as any),
    safe(db.execute(sql`SELECT b.bookingReference, b.destination, b.departureDate, b.status, b.totalPrice, b.amountPaid, COALESCE(u.name, b.leadPassengerName) AS clientName FROM bookings b LEFT JOIN users u ON b.clientId = u.id ORDER BY b.createdAt DESC LIMIT 10`), [[]] as any),
    safe(db.execute(sql`SELECT b.bookingReference, b.destination, b.departureDate, COALESCE(u.name, b.leadPassengerName) AS clientName FROM bookings b LEFT JOIN users u ON b.clientId = u.id WHERE b.departureDate IS NOT NULL AND STR_TO_DATE(b.departureDate, '%Y-%m-%d') >= ${today} AND b.status IN ('confirmed','pending') ORDER BY STR_TO_DATE(b.departureDate, '%Y-%m-%d') ASC LIMIT 10`), [[]] as any),
    safe(db.execute(sql`SELECT b.bookingReference, b.departureDate, b.totalPrice, b.amountPaid, COALESCE(u.name, b.leadPassengerName) AS clientName FROM bookings b LEFT JOIN users u ON b.clientId = u.id WHERE b.status IN ('confirmed','pending') AND CAST(b.totalPrice AS DECIMAL(10,2)) > CAST(IFNULL(b.amountPaid,0) AS DECIMAL(10,2)) ORDER BY b.departureDate ASC LIMIT 10`), [[]] as any),
    safe(db.execute(sql`SELECT name, destination, status, createdAt FROM quoteRequests ORDER BY createdAt DESC LIMIT 10`), [[]] as any),
    safe(db.execute(sql`SELECT title, destination, price FROM deals WHERE isActive = TRUE ORDER BY isFeatured DESC, updatedAt DESC LIMIT 8`), [[]] as any),
  ]);

  const num = (r: any) => Number(r?.[0]?.[0]?.c ?? 0);
  const rowsOf = (r: any) => (r?.[0] as any[]) || [];

  return {
    totals: {
      clients: num(clientCount),
      bookings: num(bookingCount),
      activeDeals: num(dealCount),
      openQuotes: num(quoteCount),
      openTickets: num(ticketCount),
    },
    recentBookings: rowsOf(recentBookings).map((b: any) => ({
      ref: b.bookingReference, client: b.clientName || "—", destination: b.destination || "—",
      departure: b.departureDate, status: b.status,
      total: Number(b.totalPrice || 0), paid: Number(b.amountPaid || 0),
    })),
    upcomingDepartures: rowsOf(upcoming).map((b: any) => ({
      ref: b.bookingReference, client: b.clientName || "—", destination: b.destination || "—", departure: b.departureDate,
    })),
    outstandingBalances: rowsOf(outstanding).map((b: any) => ({
      ref: b.bookingReference, client: b.clientName || "—",
      balance: Number(b.totalPrice || 0) - Number(b.amountPaid || 0), departure: b.departureDate,
    })),
    recentQuotes: rowsOf(recentQuotes).map((q: any) => ({
      name: q.name, destination: q.destination || "—", status: q.status,
      createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt),
    })),
    topDeals: rowsOf(topDeals).map((d: any) => ({
      title: d.title, destination: d.destination, price: Number(d.price || 0),
    })),
  };
}

// ─── Chat orchestration ─────────────────────────────────────────────────────

const ASSISTANT_SYSTEM_PROMPT = `You are CB Travel's senior in-house assistant — half operations manager, half marketing strategist.

Audience: the CB Travel admin team only. You are NOT customer-facing.

Tone: warm, sharp, decisive, UK English. Skip filler ("Certainly!", "I'd be happy to..."). Get to the point. Format with short headings, bullets, and numbered steps.

Capabilities you have:
- You can answer questions about CB Travel's bookings, clients, deals, quotes and support load using the BUSINESS SNAPSHOT below.
- You can draft client-facing emails, social posts, marketing campaigns, itineraries and policies.
- You can suggest workflow improvements, escalations and prioritised action lists.

Hard rules:
- Never invent a booking reference, client name, price or date. If the data isn't in the snapshot, say so.
- Treat the snapshot as a point-in-time view, not a real-time feed.
- When suggesting client communications, default to the CB Travel voice: warm, professional, exciting, never cheesy.
- Default contact details: WhatsApp 07495 823953, email hello@travelcb.co.uk, web www.travelcb.co.uk.`;

export async function runAssistant(args: {
  conversationId: number;
  userMessage: string;
}): Promise<string> {
  const snapshot = await buildBusinessSnapshot();
  const history = await getMessages(args.conversationId);

  const snapshotText = `BUSINESS SNAPSHOT (refreshed now)
Totals: ${snapshot.totals.clients} clients · ${snapshot.totals.bookings} bookings · ${snapshot.totals.activeDeals} active deals · ${snapshot.totals.openQuotes} open quotes · ${snapshot.totals.openTickets} open tickets

Upcoming departures (next 10):
${snapshot.upcomingDepartures.map(b => `- ${b.ref} · ${b.client} → ${b.destination} on ${b.departure || "TBC"}`).join("\n") || "- (none)"}

Outstanding balances (next 10):
${snapshot.outstandingBalances.map(b => `- ${b.ref} · ${b.client} · £${b.balance.toFixed(2)} outstanding · departs ${b.departure || "TBC"}`).join("\n") || "- (none)"}

Recent bookings:
${snapshot.recentBookings.map(b => `- ${b.ref} · ${b.client} → ${b.destination} · ${b.status} · £${b.total.toFixed(2)} (paid £${b.paid.toFixed(2)})`).join("\n") || "- (none)"}

Recent quote requests:
${snapshot.recentQuotes.map(q => `- ${q.name} → ${q.destination} · ${q.status}`).join("\n") || "- (none)"}

Featured deals on sale:
${snapshot.topDeals.map(d => `- ${d.title} · ${d.destination} · from £${d.price.toFixed(0)}`).join("\n") || "- (none)"}`;

  const messages: GroqMessage[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    { role: "system", content: snapshotText },
    ...history.slice(-20).map((m: any) => ({ role: m.role as GroqMessage["role"], content: m.content })),
    { role: "user", content: args.userMessage },
  ];

  await appendMessage(args.conversationId, "user", args.userMessage);
  const reply = await groqChat({ messages, temperature: 0.6, maxTokens: 2048 });
  await appendMessage(args.conversationId, "assistant", reply);

  // Auto-title the conversation from the first exchange
  if (history.length === 0) {
    const titleSrc = args.userMessage.replace(/\s+/g, " ").trim();
    const title = titleSrc.length > 60 ? titleSrc.slice(0, 57) + "…" : titleSrc;
    const { getDb } = await import("./db");
    const db = await getDb();
    if (db) await db.execute(sql`UPDATE aiAssistantConversations SET title = ${title} WHERE id = ${args.conversationId}`);
  }

  return reply;
}
