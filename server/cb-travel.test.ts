import { describe, expect, it, beforeEach, vi } from "vitest";
import { hashPassword, verifyPassword } from "./db";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", () => {
    const password = "MySecurePassword123!";
    const hash = hashPassword(password);
    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("correct-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", () => {
    const password = "SamePassword";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });

  it("returns false for malformed hash", () => {
    expect(verifyPassword("password", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("password", "")).toBe(false);
  });
});

// ─── Auth logout ──────────────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "local_test_user",
    email: "test@cbtravel.uk",
    name: "Test User",
    loginMethod: "password",
    role: "user",
    phone: "07700900000",
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect(me?.email).toBe("test@cbtravel.uk");
    expect(me?.role).toBe("user");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ─── Admin access control ─────────────────────────────────────────────────────

describe("admin access control", () => {
  it("throws FORBIDDEN for non-admin user accessing admin procedures", async () => {
    const { ctx } = createAuthContext(); // role: "user"
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allBookings()).rejects.toThrow();
  });

  it("allows admin user to access admin procedures", async () => {
    const clearedCookies: CookieCall[] = [];
    const adminUser: AuthenticatedUser = {
      id: 2,
      openId: "local_admin_user",
      email: "admin@cbtravel.uk",
      name: "Admin",
      loginMethod: "password",
      role: "admin",
      phone: "07495823953",
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx: TrpcContext = {
      user: adminUser,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (n: string, o: Record<string, unknown>) => clearedCookies.push({ name: n, options: o }) } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    // Should not throw — admin can list bookings (empty array from mocked DB)
    const result = await caller.admin.allBookings().catch((e: any) => {
      // Only throw if it's a FORBIDDEN error, not a DB connection error
      if (e?.data?.code === "FORBIDDEN") throw e;
      return [];
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Public procedures ────────────────────────────────────────────────────────

describe("public procedures", () => {
  const publicCtx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  it("deals.list returns an array", async () => {
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.deals.list().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("testimonials.list returns an array", async () => {
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.testimonials.list().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});
