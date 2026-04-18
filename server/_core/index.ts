import { startJobs } from "../jobs";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { flightStatusHandler } from "../flight-status";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
    startJobs();
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Flight Status REST endpoint
  app.get("/api/flight-status", flightStatusHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    startJobs();
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// ─── Auto-send postcards job (runs every hour) ─────────────────────────────
async function runPostcardJob() {
  try {
    const { getBookingsDueForPostcard, markPostcardSent, getUserById } = await import("../db");
    const { sendPostcardEmail } = await import("../emails");
    const bookings = await getBookingsDueForPostcard();
    for (const booking of bookings) {
      try {
        const user = booking.clientId ? await getUserById(booking.clientId) : null;
        const email = user?.email || booking.leadPassengerEmail;
        const name = user?.name || booking.leadPassengerName || 'Traveller';
        if (email) {
          await sendPostcardEmail(email, name, {
            bookingReference: booking.bookingReference,
            destination: booking.destination,
            departureDate: booking.departureDate,
            returnDate: booking.returnDate,
            numberOfTravelers: booking.numberOfTravelers,
          });
          await markPostcardSent(booking.id);
          console.log(`[Postcard] Sent to ${email} for booking ${booking.bookingReference}`);
        }
      } catch (err) {
        console.error(`[Postcard] Failed for booking ${booking.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[Postcard Job] Error:', err);
  }
}

// Run postcard job every hour
setInterval(runPostcardJob, 60 * 60 * 1000);
// Also run 5 minutes after startup
setTimeout(runPostcardJob, 5 * 60 * 1000);
