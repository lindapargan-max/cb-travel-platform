/**
 * CB Travel – Server Security Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Applied at the Express layer, before tRPC routes, so these limits fire
 * regardless of application logic.
 */

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Express } from "express";

// ─── Helmet – Security Headers ────────────────────────────────────────────────
// Protects against XSS, clickjacking, MIME sniffing, etc.
// CSP is disabled because the React SPA loads inline scripts via Vite/CDN.
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,         // React + Vite inline scripts
  crossOriginEmbedderPolicy: false,     // Allows CDN fonts/images
  crossOriginResourcePolicy: false,     // Allows cross-origin static assets
});

// ─── General API Limiter ──────────────────────────────────────────────────────
// 300 requests per minute per IP on all /api routes.
// Stops scraping, enumeration, and runaway clients.
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute window
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown",
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests. Please slow down.",
      code: "RATE_LIMITED",
    });
  },
});

// ─── Auth Limiter ─────────────────────────────────────────────────────────────
// 10 attempts per 15 minutes per IP on login / forgot-password / reset-password.
// skipSuccessfulRequests: true means a successful login doesn't count toward the cap.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,      // 15 minute window
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown",
  handler: (_req, res) => {
    res.status(429).json({
      error:
        "Too many attempts from this IP address. Please wait 15 minutes before trying again.",
      code: "AUTH_RATE_LIMITED",
    });
  },
});

// ─── Itinerary Generator Limiter ──────────────────────────────────────────────
// The generator calls Groq — cap at 20 generations per hour per IP.
export const itineraryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,      // 1 hour window
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown",
  handler: (_req, res) => {
    res.status(429).json({
      error:
        "You've generated too many itineraries this hour. Please try again later.",
      code: "ITINERARY_RATE_LIMITED",
    });
  },
});

// ─── Apply All Security Middleware ────────────────────────────────────────────
export function applySecurityMiddleware(app: Express) {
  // 1. Security headers on every response
  app.use(helmetMiddleware);

  // 2. General API rate limit
  app.use("/api/", generalApiLimiter);

  // 3. Strict auth rate limit — applied BEFORE tRPC middleware picks it up
  //    tRPC exposes mutations at /api/trpc/<router>.<procedure>
  app.use("/api/trpc/auth.login", authLimiter);
  app.use("/api/trpc/auth.forgotPassword", authLimiter);
  app.use("/api/trpc/auth.resetPassword", authLimiter);
  app.use("/api/trpc/auth.setPassword", authLimiter);

  // 4. Itinerary generator limiter
  app.use("/api/trpc/itinerary.generate", itineraryLimiter);
  app.use("/api/trpc/itinerary.generateItinerary", itineraryLimiter);
}
