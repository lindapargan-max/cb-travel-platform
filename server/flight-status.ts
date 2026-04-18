/**
 * Flight Status API endpoint
 * Uses AeroDataBox via RapidAPI (free tier: 500 calls/month)
 * Set RAPIDAPI_KEY in your Railway environment variables.
 * Sign up free at: https://rapidapi.com/aedbx-aedbx/api/aerodatabox
 */

import { Request, Response } from "express";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const AERODATABOX_HOST = "aerodatabox.p.rapidapi.com";

// Normalize flight number: strip spaces, uppercase
function normalizeFlightNumber(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase().trim();
}

interface AeroFlightResponse {
  departure?: {
    airport?: { iata?: string; icao?: string; name?: string; municipalityName?: string };
    scheduledTime?: { local?: string; utc?: string };
    revisedTime?: { local?: string; utc?: string };
    terminal?: string;
    gate?: string;
    quality?: string[];
    checkInDesk?: string;
    baggageBelt?: string;
    runway?: { scheduledTime?: { utc?: string; local?: string } };
  };
  arrival?: {
    airport?: { iata?: string; icao?: string; name?: string; municipalityName?: string };
    scheduledTime?: { local?: string; utc?: string };
    revisedTime?: { local?: string; utc?: string };
    terminal?: string;
    gate?: string;
    quality?: string[];
    baggageBelt?: string;
    runway?: { scheduledTime?: { utc?: string; local?: string } };
  };
  number?: string;
  status?: string;
  codeshareStatus?: string;
  isCargo?: boolean;
  aircraft?: { model?: string; reg?: string; modeS?: string; image?: { url?: string } };
  airline?: { name?: string; iata?: string; icao?: string };
  callSign?: string;
  movement?: {
    latitude?: number;
    longitude?: number;
    altitude?: { feet?: number; meters?: number };
    speed?: { horizontal?: number; isGround?: boolean };
    direction?: number;
    verticalSpeed?: { feetPerMinute?: number };
  };
}

export async function flightStatusHandler(req: Request, res: Response) {
  const flightRaw = (req.query.flight as string) || "";
  if (!flightRaw) {
    return res.status(400).json({ error: "Missing flight parameter" });
  }

  if (!RAPIDAPI_KEY) {
    return res.status(503).json({
      error: "RAPIDAPI_KEY not configured",
      message:
        "The Flight Manager needs a RapidAPI key to fetch live data. Add RAPIDAPI_KEY to your Railway environment variables. Get a free key at https://rapidapi.com/aedbx-aedbx/api/aerodatabox",
    });
  }

  const flight = normalizeFlightNumber(flightRaw);

  // AeroDataBox endpoint: search by flight number (IATA or ICAO)
  // We search for flights departing/arriving today and tomorrow
  const now = new Date();
  const dates = [
    formatDate(now),
    formatDate(new Date(now.getTime() + 86400000)), // tomorrow
    formatDate(new Date(now.getTime() - 86400000)), // yesterday (for overnight flights)
  ];

  let found: AeroFlightResponse | null = null;
  let fetchError = "";

  for (const date of dates) {
    if (found) break;
    try {
      const url = `https://${AERODATABOX_HOST}/flights/number/${encodeURIComponent(flight)}/${date}`;
      const response = await fetch(url, {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": AERODATABOX_HOST,
        },
      });

      if (response.status === 429) {
        return res.status(429).json({ error: "Rate limit reached. Try again in a moment." });
      }
      if (response.status === 404) continue;
      if (!response.ok) {
        fetchError = `API returned ${response.status}`;
        continue;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        found = data[0] as AeroFlightResponse;
      } else if (data && !Array.isArray(data) && data.number) {
        found = data as AeroFlightResponse;
      }
    } catch (e: any) {
      fetchError = e.message;
    }
  }

  if (!found) {
    return res.status(404).json({
      error: fetchError || "Flight not found",
      message: `No results for "${flight}". Make sure you're using the IATA flight number (e.g. EZY8432, BA2490, VS401).`,
    });
  }

  // Shape the response for the frontend
  const result = {
    flightNumber: found.number || flight,
    callSign: found.callSign,
    status: found.status || "Unknown",
    airline: found.airline?.name || null,
    airlineIata: found.airline?.iata || null,
    aircraft: found.aircraft?.model || null,
    registration: found.aircraft?.reg || null,
    aircraftImage: found.aircraft?.image?.url || null,

    departure: found.departure
      ? {
          airport: found.departure.airport?.name || null,
          iata: found.departure.airport?.iata || null,
          city: found.departure.airport?.municipalityName || null,
          scheduled: found.departure.scheduledTime?.local || null,
          scheduledUtc: found.departure.scheduledTime?.utc || null,
          revised: found.departure.revisedTime?.local || null,
          revisedUtc: found.departure.revisedTime?.utc || null,
          terminal: found.departure.terminal || null,
          gate: found.departure.gate || null,
          checkInDesk: found.departure.checkInDesk || null,
          runwayTime: found.departure.runway?.scheduledTime?.local || null,
        }
      : null,

    arrival: found.arrival
      ? {
          airport: found.arrival.airport?.name || null,
          iata: found.arrival.airport?.iata || null,
          city: found.arrival.airport?.municipalityName || null,
          scheduled: found.arrival.scheduledTime?.local || null,
          scheduledUtc: found.arrival.scheduledTime?.utc || null,
          revised: found.arrival.revisedTime?.local || null,
          revisedUtc: found.arrival.revisedTime?.utc || null,
          terminal: found.arrival.terminal || null,
          gate: found.arrival.gate || null,
          baggageBelt: found.arrival.baggageBelt || null,
          runwayTime: found.arrival.runway?.scheduledTime?.local || null,
        }
      : null,

    live: found.movement
      ? {
          altitude: found.movement.altitude?.feet || null,
          speed: found.movement.speed?.horizontal || null,
          isGround: found.movement.speed?.isGround ?? null,
          direction: found.movement.direction || null,
          lat: found.movement.latitude || null,
          lon: found.movement.longitude || null,
        }
      : null,
  };

  return res.json({ data: [result] });
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
