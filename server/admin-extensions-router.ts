// ─────────────────────────────────────────────────────────────────────────────
// server/admin-extensions-router.ts
//
// New tRPC routers for the V13 enhancements:
//   - aiAssistant         — Admin AI chat (GROQ-powered, business-aware)
//   - emailTemplates      — CRUD for booking/marketing email templates
//   - bookingEmails       — Trigger detection + queue + preview + send
//   - socialHub           — Generate, schedule and manage social posts
//   - destinationSpotlight — AI-generated spotlight blurbs + social copy
//   - travelHacks         — AI-generated traveller tips library
//
// HOW TO WIRE IN:
//   1. Drop this file into  server/admin-extensions-router.ts
//   2. In  server/routers.ts , at the top of the file add:
//        import {
//          aiAssistantRouter, emailTemplatesRouter, bookingEmailsRouter,
//          socialHubRouter, destinationSpotlightRouter, travelHacksRouter,
//        } from "./admin-extensions-router";
//   3. Inside the existing  appRouter = router({ ... })  block (between e.g.
//      `notifications` and `terms`) add:
//        aiAssistant: aiAssistantRouter,
//        emailTemplates: emailTemplatesRouter,
//        bookingEmails: bookingEmailsRouter,
//        socialHub: socialHubRouter,
//        destinationSpotlight: destinationSpotlightRouter,
//        travelHacks: travelHacksRouter,
// ─────────────────────────────────────────────────────────────────────────────

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { adminProcedure, router } from "./_core/trpc";
import { groqChat, parseJsonLoose } from "./_groq";
import {
  createConversation, listConversations, getMessages,
  renameConversation, deleteConversation, runAssistant, buildBusinessSnapshot,
} from "./ai-assistant";
import {
  getAllEmailTemplates, getEmailTemplate, upsertEmailTemplate,
  buildBookingTemplateData, sendTemplatedBookingEmail, renderTemplate, listPlaceholders,
} from "./booking-emails";
import {
  detectAllTriggers, listQueue, dismissQueueItem,
  previewQueueItem, sendQueueItem, addToQueue,
} from "./notification-queue";
import {
  generateSocialPost, createSocialPost, updateSocialPost, deleteSocialPost,
  listSocialPosts, getSocialPost,
} from "./social-hub";

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI Assistant
// ─────────────────────────────────────────────────────────────────────────────

export const aiAssistantRouter = router({
  listConversations: adminProcedure.query(async ({ ctx }) => {
    return listConversations((ctx as any).user.id);
  }),

  getConversation: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getMessages(input.id);
    }),

  createConversation: adminProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = await createConversation((ctx as any).user.id, input.title);
      return { id };
    }),

  renameConversation: adminProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      await renameConversation(input.id, (ctx as any).user.id, input.title);
      return { ok: true };
    }),

  deleteConversation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteConversation(input.id, (ctx as any).user.id);
      return { ok: true };
    }),

  sendMessage: adminProcedure
    .input(z.object({ conversationId: z.number(), message: z.string().min(1).max(4000) }))
    .mutation(async ({ input }) => {
      const reply = await runAssistant({ conversationId: input.conversationId, userMessage: input.message });
      return { reply };
    }),

  snapshot: adminProcedure.query(async () => {
    return buildBusinessSnapshot();
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Email Templates
// ─────────────────────────────────────────────────────────────────────────────

export const emailTemplatesRouter = router({
  list: adminProcedure.query(async () => getAllEmailTemplates()),

  get: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => getEmailTemplate(input.key)),

  upsert: adminProcedure
    .input(z.object({
      key: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
      name: z.string().min(1).max(255),
      subject: z.string().min(1).max(500),
      body: z.string().min(1),
      category: z.enum(["booking", "marketing", "system"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await upsertEmailTemplate(input);
      try {
        const { writeAuditLog } = await import("./db");
        await writeAuditLog({
          actorId: (ctx as any).user?.id, actorType: "admin",
          action: "email_template.upsert", entityType: "emailTemplate",
          newValue: { key: input.key, name: input.name },
        });
      } catch {}
      return { ok: true };
    }),

  delete: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.execute(sql`DELETE FROM emailTemplates WHERE \`key\` = ${input.key}`);
      return { ok: true };
    }),

  /** Render a template against a real booking for preview */
  preview: adminProcedure
    .input(z.object({ key: z.string(), bookingId: z.number() }))
    .query(async ({ input }) => {
      const tpl = await getEmailTemplate(input.key);
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      const data = await buildBookingTemplateData(input.bookingId);
      return {
        to: data._to || "(no email on file)",
        subject: renderTemplate(tpl.subject, data),
        html: renderTemplate(tpl.body, data),
        placeholders: listPlaceholders(tpl.subject + " " + tpl.body),
      };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Booking Emails / Notification Queue
// ─────────────────────────────────────────────────────────────────────────────

export const bookingEmailsRouter = router({
  /** Run trigger detection now. Inserts pending queue items, never sends. */
  detectTriggers: adminProcedure.mutation(async ({ ctx }) => {
    const counts = await detectAllTriggers();
    try {
      const { writeAuditLog } = await import("./db");
      await writeAuditLog({
        actorId: (ctx as any).user?.id, actorType: "admin",
        action: "booking_emails.detect_triggers", newValue: counts,
      });
    } catch {}
    return counts;
  }),

  /** List pending / sent / dismissed queue items */
  listQueue: adminProcedure
    .input(z.object({ status: z.enum(["pending", "sent", "dismissed", "failed"]).optional() }).optional())
    .query(async ({ input }) => listQueue({ status: input?.status })),

  /** Render a preview of a queue item */
  previewQueueItem: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => previewQueueItem(input.id)),

  /** Manually queue a notification for a booking */
  queueOne: adminProcedure
    .input(z.object({ bookingId: z.number(), templateKey: z.string() }))
    .mutation(async ({ input }) => {
      await addToQueue({ bookingId: input.bookingId, templateKey: input.templateKey });
      return { ok: true };
    }),

  /** Send a queued item (with optional admin edits) */
  sendQueueItem: adminProcedure
    .input(z.object({
      id: z.number(),
      subjectOverride: z.string().optional(),
      bodyOverride: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await sendQueueItem({
        id: input.id, adminId: (ctx as any).user?.id,
        subjectOverride: input.subjectOverride, bodyOverride: input.bodyOverride,
      });
      try {
        const { writeAuditLog } = await import("./db");
        await writeAuditLog({
          actorId: (ctx as any).user?.id, actorType: "admin",
          action: "booking_emails.send", entityType: "bookingNotificationQueue", entityId: input.id,
          newValue: { success: result.success, error: result.error },
        });
      } catch {}
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Send failed" });
      }
      return { ok: true };
    }),

  /** Dismiss a queue item (admin decided not to send) */
  dismissQueueItem: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await dismissQueueItem(input.id, (ctx as any).user?.id);
      return { ok: true };
    }),

  /** Send a one-off templated email to a booking outside of the queue */
  sendAdHoc: adminProcedure
    .input(z.object({
      bookingId: z.number(),
      templateKey: z.string(),
      subjectOverride: z.string().optional(),
      bodyOverride: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await sendTemplatedBookingEmail({
        templateKey: input.templateKey,
        bookingId: input.bookingId,
        subjectOverride: input.subjectOverride,
        bodyOverride: input.bodyOverride,
        sentBy: (ctx as any).user?.id,
      });
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Send failed" });
      }
      return { ok: true };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Social Hub
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_ENUM = z.enum(["instagram", "facebook", "twitter", "tiktok", "linkedin"]);
const STATUS_ENUM = z.enum(["draft", "scheduled", "published", "archived"]);

export const socialHubRouter = router({
  list: adminProcedure
    .input(z.object({
      status: STATUS_ENUM.optional(),
      platform: PLATFORM_ENUM.optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional())
    .query(async ({ input }) => listSocialPosts(input || {})),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getSocialPost(input.id)),

  generate: adminProcedure
    .input(z.object({
      platform: PLATFORM_ENUM,
      topic: z.string().min(1).max(500),
      destination: z.string().optional(),
      dealId: z.number().optional(),
      tone: z.string().optional(),
      callToAction: z.string().optional(),
    }))
    .mutation(async ({ input }) => generateSocialPost(input)),

  create: adminProcedure
    .input(z.object({
      platform: PLATFORM_ENUM,
      title: z.string().optional(),
      body: z.string().min(1),
      caption: z.string().optional(),
      hashtags: z.string().optional(),
      imagePrompt: z.string().optional(),
      imageUrl: z.string().optional(),
      scheduledFor: z.date().nullable().optional(),
      status: STATUS_ENUM.optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createSocialPost({ ...input, createdBy: (ctx as any).user?.id });
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      platform: PLATFORM_ENUM.optional(),
      title: z.string().optional(),
      body: z.string().optional(),
      caption: z.string().optional(),
      hashtags: z.string().optional(),
      imagePrompt: z.string().optional(),
      imageUrl: z.string().optional(),
      scheduledFor: z.date().nullable().optional(),
      status: STATUS_ENUM.optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...patch } = input;
      await updateSocialPost(id, patch);
      return { ok: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSocialPost(input.id);
      return { ok: true };
    }),

  /** Calendar view: posts grouped by date for a given month */
  calendar: adminProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input }) => {
      const from = new Date(input.year, input.month - 1, 1);
      const to = new Date(input.year, input.month, 0, 23, 59, 59);
      const posts = await listSocialPosts({ from, to, limit: 500 });
      const byDay: Record<string, any[]> = {};
      for (const p of posts) {
        const d = p.scheduledFor ? new Date(p.scheduledFor) : new Date(p.createdAt);
        const key = d.toISOString().slice(0, 10);
        (byDay[key] ||= []).push(p);
      }
      return { byDay, total: posts.length };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Destination Spotlight
// ─────────────────────────────────────────────────────────────────────────────

export const destinationSpotlightRouter = router({
  list: adminProcedure.query(async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(sql`SELECT * FROM destinationSpotlights ORDER BY createdAt DESC LIMIT 200`);
    return ((rows as any)[0] as any[]) || [];
  }),

  generate: adminProcedure
    .input(z.object({
      destination: z.string().min(1).max(255),
      country: z.string().optional(),
      season: z.string().optional(),
      angle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const prompt = `You are CB Travel's senior destination editor. CB Travel is a UK luxury travel concierge. Voice: warm, aspirational, sophisticated, specific.

Create a Destination Spotlight for: ${input.destination}${input.country ? `, ${input.country}` : ""}.
${input.season ? `Season focus: ${input.season}.` : ""}
${input.angle ? `Angle: ${input.angle}.` : ""}

Return ONLY valid JSON:
{
  "headline": "An evocative headline, max 90 chars",
  "copyShort": "2 sentences for a homepage tile or email banner — sensory, specific, no clichés.",
  "copyLong": "3 short paragraphs (HTML <p> tags allowed) for a feature card. Cover the WHY NOW (season/event), the SIGNATURE EXPERIENCE (one specific thing only CB Travel would suggest), and a soft CTA pointing to WhatsApp 07495 823953 or hello@travelcb.co.uk.",
  "socialCaption": "Instagram caption (max 220 chars) with one hook line, one detail, then a soft CTA. End with 6-8 hashtags including #CBTravel.",
  "imagePrompts": [
    "Photorealistic editorial image prompt 1 — landscape orientation, no text",
    "Photorealistic editorial image prompt 2 — close-up detail, no text",
    "Photorealistic editorial image prompt 3 — moody atmosphere shot, no text"
  ]
}`;

      const raw = await groqChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8, maxTokens: 1500, jsonMode: true,
      });
      return parseJsonLoose(raw);
    }),

  save: adminProcedure
    .input(z.object({
      destination: z.string(),
      country: z.string().optional(),
      season: z.string().optional(),
      headline: z.string().optional(),
      copyShort: z.string().optional(),
      copyLong: z.string().optional(),
      socialCaption: z.string().optional(),
      imagePrompts: z.array(z.string()).optional(),
      status: z.enum(["draft", "ready", "published"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.execute(sql`
        INSERT INTO destinationSpotlights (destination, country, season, headline, copyShort, copyLong, socialCaption, imagePrompts, status, createdBy)
        VALUES (${input.destination}, ${input.country || null}, ${input.season || null},
                ${input.headline || null}, ${input.copyShort || null}, ${input.copyLong || null},
                ${input.socialCaption || null}, ${input.imagePrompts ? JSON.stringify(input.imagePrompts) : null},
                ${input.status || "draft"}, ${(ctx as any).user?.id || null})
      `);
      return { id: (result as any)[0]?.insertId };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return;
      await db.execute(sql`DELETE FROM destinationSpotlights WHERE id = ${input.id}`);
      return { ok: true };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Travel Hacks
// ─────────────────────────────────────────────────────────────────────────────

export const travelHacksRouter = router({
  list: adminProcedure.query(async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(sql`SELECT * FROM travelHacks ORDER BY createdAt DESC LIMIT 200`);
    return ((rows as any)[0] as any[]) || [];
  }),

  generate: adminProcedure
    .input(z.object({
      topic: z.string().min(1).max(255),
      audience: z.string().optional(),
      destination: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const prompt = `You are CB Travel's senior travel editor — think Condé Nast Traveller meets a sharp travel agent who knows every airline trick.

Generate a Travel Hack post for: "${input.topic}"
${input.destination ? `Destination context: ${input.destination}` : ""}
${input.audience ? `Audience: ${input.audience}` : "Audience: UK luxury / premium travellers"}

Return ONLY valid JSON:
{
  "title": "Punchy, specific title — promise a real outcome (max 80 chars)",
  "summary": "1-sentence hook for a card or email teaser",
  "body": "Full article in HTML. 3-5 short sections with <h3> headings, scannable bullet lists, and a final 'CB Travel pro tip' callout. End with a soft CTA to WhatsApp 07495 823953 or hello@travelcb.co.uk.",
  "category": "One of: Flights, Hotels, Packing, Loyalty, Money, Family, Cruise, Documents, Comfort, Tech",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

      const raw = await groqChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85, maxTokens: 2500, jsonMode: true,
      });
      return parseJsonLoose(raw);
    }),

  save: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string().min(1).max(255),
      summary: z.string().optional(),
      body: z.string().min(1),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.id) {
        await db.execute(sql`
          UPDATE travelHacks SET
            title = ${input.title},
            summary = ${input.summary || null},
            body = ${input.body},
            category = ${input.category || null},
            tags = ${input.tags ? JSON.stringify(input.tags) : null},
            isPublished = ${input.isPublished ?? false}
          WHERE id = ${input.id}
        `);
        return { id: input.id };
      } else {
        const r = await db.execute(sql`
          INSERT INTO travelHacks (title, summary, body, category, tags, isPublished, createdBy)
          VALUES (${input.title}, ${input.summary || null}, ${input.body}, ${input.category || null},
                  ${input.tags ? JSON.stringify(input.tags) : null}, ${input.isPublished ?? false},
                  ${(ctx as any).user?.id || null})
        `);
        return { id: (r as any)[0]?.insertId };
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return;
      await db.execute(sql`DELETE FROM travelHacks WHERE id = ${input.id}`);
      return { ok: true };
    }),

  togglePublish: adminProcedure
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return;
      await db.execute(sql`UPDATE travelHacks SET isPublished = ${input.isPublished} WHERE id = ${input.id}`);
      return { ok: true };
    }),
});
