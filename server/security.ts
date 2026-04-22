/**
 * security.ts — Zero-dependency security middleware
 *
 * Provides:
 *  1. Helmet-equivalent security headers (set manually)
 *  2. In-memory rate limiting — 3 tiers:
 *       • login / auth routes      → 10 req / 15 min
 *       • itinerary generator      → 20 req / 1 hr
 *       • all other /api/ routes   → 300 req / 1 min
 */

import { Request, Response, NextFunction, Application } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Window {
  count: number;
  resetAt: number;
}

interface LimiterConfig {
  /** Max requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Human-readable wait description for the error message */
  waitMsg: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const store = new Map<string, Window>();

/** Clean up expired entries every 10 minutes to prevent memory leaks */
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (now > win.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

// ─── Core factory ─────────────────────────────────────────────────────────────

function createLimiter(config: LimiterConfig) {
  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Trust Railway's proxy — real IP is in X-Forwarded-For
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `${config.max}:${config.windowMs}:${ip}:${req.path}`;
    const now = Date.now();
    let win = store.get(key);

    if (!win || now > win.resetAt) {
      win = { count: 1, resetAt: now + config.windowMs };
      store.set(key, win);
      return next();
    }

    win.count++;
    if (win.count > config.max) {
      const retryAfterSec = Math.ceil((win.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: "Too Many Requests",
        message: `Too many requests. Please wait ${config.waitMsg} before trying again.`,
        retryAfter: retryAfterSec,
      });
      return;
    }

    next();
  };
}

// ─── Pre-built limiters ───────────────────────────────────────────────────────

/** Login / forgot-password / reset-password: 10 attempts per 15 min */
const authLimiter = createLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  waitMsg: "15 minutes",
});

/** Itinerary generator: 20 generations per hour */
const itineraryLimiter = createLimiter({
  max: 20,
  windowMs: 60 * 60 * 1000,
  waitMsg: "1 hour",
});

/** General API: 300 requests per minute */
const generalLimiter = createLimiter({
  max: 300,
  windowMs: 60 * 1000,
  waitMsg: "a moment",
});

// ─── Security headers middleware ──────────────────────────────────────────────

function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Stop MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Legacy XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Limit referrer leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Force HTTPS for 1 year (only meaningful in prod behind TLS termination)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  // Basic permissions policy — disable unnecessary browser APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Apply all security middleware to the Express app.
 * Call this BEFORE body parsers and routes.
 */
export function applySecurityMiddleware(app: Application) {
  // 1. Security headers on every response
  app.use(securityHeaders);

  // 2. Auth rate limiting — narrowly scoped to sensitive paths
  app.use("/api/trpc/login", authLimiter);
  app.use("/api/trpc/forgotPassword", authLimiter);
  app.use("/api/trpc/resetPassword", authLimiter);

  // 3. Itinerary generator rate limit
  app.use("/api/trpc/generateItinerary", itineraryLimiter);
  app.use("/api/trpc/verifyItineraryPassword", itineraryLimiter);

  // 4. General API rate limit — everything else
  app.use("/api/", generalLimiter);
}
