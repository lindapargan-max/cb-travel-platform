// ─────────────────────────────────────────────────────────────────────────────
// server/social-hub.ts
// Social media content hub — generation + persistence + calendar.
// ─────────────────────────────────────────────────────────────────────────────

import { sql } from "drizzle-orm";
import { groqChat, parseJsonLoose } from "./_groq";

export type Platform = "instagram" | "facebook" | "twitter" | "tiktok" | "linkedin";
export type SocialStatus = "draft" | "scheduled" | "published" | "archived";

const PLATFORM_GUIDE: Record<Platform, string> = {
  instagram: "Visual-first. 1-2 short paragraphs, emoji light, 8-12 hashtags. Hook in first line.",
  facebook:  "Conversational. 2-3 paragraphs, link-friendly, 2-4 hashtags. Lead with a story.",
  twitter:   "Punchy. Single tweet under 270 chars, 1-3 hashtags. No fluff.",
  tiktok:    "Hook + caption + 5-10 hashtags. Spoken-word phrasing for voiceover.",
  linkedin:  "Professional. 3-4 paragraphs, insight-led, 3-5 hashtags. No emoji overload.",
};

// ─── Generation ─────────────────────────────────────────────────────────────

export async function generateSocialPost(args: {
  platform: Platform;
  topic: string;
  destination?: string;
  dealId?: number;
  tone?: string;
  callToAction?: string;
}): Promise<{ title: string; body: string; caption: string; hashtags: string; imagePrompt: string; }> {
  let dealContext = "";
  if (args.dealId) {
    try {
      const { getDealById } = await import("./db");
      const deal = await getDealById(args.dealId);
      if (deal) dealContext = `\n\nDEAL CONTEXT:\nTitle: ${deal.title}\nDestination: ${deal.destination}\nPrice: £${deal.price}\nDescription: ${deal.description}`;
    } catch {}
  }

  const prompt = `You are CB Travel's social media manager. CB Travel is a UK luxury travel concierge. Voice: warm, aspirational, sophisticated, witty when it lands — never cheesy.

PLATFORM: ${args.platform}
PLATFORM RULES: ${PLATFORM_GUIDE[args.platform]}

TOPIC: ${args.topic}
${args.destination ? `DESTINATION: ${args.destination}` : ""}
${args.tone ? `TONE OVERRIDE: ${args.tone}` : ""}
${args.callToAction ? `REQUIRED CTA: ${args.callToAction}` : `DEFAULT CTA: WhatsApp 07495 823953 or hello@travelcb.co.uk`}${dealContext}

Return ONLY valid JSON, no markdown fences:
{
  "title": "Short internal title for the admin (max 60 chars)",
  "body": "Full post body matching the platform rules. Include the CTA naturally.",
  "caption": "One-line scroll-stopping hook (for Reels / TikTok overlays)",
  "hashtags": "Space-separated hashtags including #CBTravel and 2-3 destination-specific tags",
  "imagePrompt": "A single-sentence image generation prompt — photorealistic, editorial, no text overlay"
}`;

  const raw = await groqChat({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85,
    maxTokens: 1024,
    jsonMode: true,
  });
  return parseJsonLoose(raw);
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function createSocialPost(input: {
  platform: Platform; title?: string; body: string; caption?: string;
  hashtags?: string; imagePrompt?: string; imageUrl?: string;
  scheduledFor?: Date | null; status?: SocialStatus; tags?: string[]; createdBy?: number;
}): Promise<number> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.execute(sql`
    INSERT INTO socialPosts (platform, title, body, caption, hashtags, imagePrompt, imageUrl, scheduledFor, status, tags, createdBy)
    VALUES (${input.platform}, ${input.title || null}, ${input.body}, ${input.caption || null},
            ${input.hashtags || null}, ${input.imagePrompt || null}, ${input.imageUrl || null},
            ${input.scheduledFor ?? null}, ${input.status || 'draft'},
            ${input.tags ? JSON.stringify(input.tags) : null}, ${input.createdBy || null})
  `);
  return (result as any)[0]?.insertId as number;
}

export async function updateSocialPost(id: number, patch: Partial<{
  platform: Platform; title: string; body: string; caption: string;
  hashtags: string; imagePrompt: string; imageUrl: string;
  scheduledFor: Date | null; status: SocialStatus; tags: string[];
}>): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  const sets: any[] = [];
  if (patch.platform !== undefined) sets.push(sql`platform = ${patch.platform}`);
  if (patch.title !== undefined) sets.push(sql`title = ${patch.title}`);
  if (patch.body !== undefined) sets.push(sql`body = ${patch.body}`);
  if (patch.caption !== undefined) sets.push(sql`caption = ${patch.caption}`);
  if (patch.hashtags !== undefined) sets.push(sql`hashtags = ${patch.hashtags}`);
  if (patch.imagePrompt !== undefined) sets.push(sql`imagePrompt = ${patch.imagePrompt}`);
  if (patch.imageUrl !== undefined) sets.push(sql`imageUrl = ${patch.imageUrl}`);
  if (patch.scheduledFor !== undefined) sets.push(sql`scheduledFor = ${patch.scheduledFor}`);
  if (patch.status !== undefined) {
    sets.push(sql`status = ${patch.status}`);
    if (patch.status === "published") sets.push(sql`publishedAt = NOW()`);
  }
  if (patch.tags !== undefined) sets.push(sql`tags = ${JSON.stringify(patch.tags)}`);
  if (sets.length === 0) return;
  // Build comma-separated SET clause
  let setSql = sets[0];
  for (let i = 1; i < sets.length; i++) setSql = sql`${setSql}, ${sets[i]}`;
  await db.execute(sql`UPDATE socialPosts SET ${setSql} WHERE id = ${id}`);
}

export async function deleteSocialPost(id: number): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`DELETE FROM socialPosts WHERE id = ${id}`);
}

export async function listSocialPosts(opts: { status?: SocialStatus; platform?: Platform; from?: Date; to?: Date; limit?: number } = {}): Promise<any[]> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  const conds: any[] = [sql`1=1`];
  if (opts.status) conds.push(sql`status = ${opts.status}`);
  if (opts.platform) conds.push(sql`platform = ${opts.platform}`);
  if (opts.from) conds.push(sql`(scheduledFor IS NULL OR scheduledFor >= ${opts.from})`);
  if (opts.to) conds.push(sql`(scheduledFor IS NULL OR scheduledFor <= ${opts.to})`);
  let where = conds[0];
  for (let i = 1; i < conds.length; i++) where = sql`${where} AND ${conds[i]}`;
  const limit = opts.limit ?? 200;
  const rows = await db.execute(sql`SELECT * FROM socialPosts WHERE ${where} ORDER BY COALESCE(scheduledFor, createdAt) DESC LIMIT ${limit}`);
  return ((rows as any)[0] as any[]) || [];
}

export async function getSocialPost(id: number): Promise<any | null> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql`SELECT * FROM socialPosts WHERE id = ${id} LIMIT 1`);
  return ((rows as any)[0] as any[])[0] || null;
}
