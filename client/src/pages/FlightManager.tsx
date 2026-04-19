import { useState, useEffect, useCallback, useRef } from "react";
import { useSEO } from '@/hooks/useSEO';

const API_BASE = import.meta.env.VITE_API_URL || "";
const STORAGE_KEY = "cb_tracked_flights";
const FOLLOWED_KEY = "cb_followed_flights";
const REFRESH_INTERVAL = 60;
const GOLD = "#c9a84c";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AirportInfo {
  airport: string | null;
  iata: string | null;
  city: string | null;
  scheduled: string | null;
  scheduledUtc: string | null;
  revised: string | null;
  revisedUtc: string | null;
  terminal: string | null;
  gate: string | null;
  checkInDesk?: string | null;
  baggageBelt?: string | null;
  runwayTime?: string | null;
}

interface LiveInfo {
  altitude: number | null;
  speed: number | null;
  isGround: boolean | null;
  direction: number | null;
  lat: number | null;
  lon: number | null;
}

interface FlightData {
  flightNumber: string;
  callSign: string | null;
  status: string;
  airline: string | null;
  airlineIata: string | null;
  aircraft: string | null;
  registration: string | null;
  aircraftImage: string | null;
  departure: AirportInfo | null;
  arrival: AirportInfo | null;
  live: LiveInfo | null;
}

interface TrackedFlight {
  flightNumber: string;
  data: FlightData | null;
  loading: boolean;
  error: string | null;
  serverMessage: string | null;
  lastUpdated: Date | null;
  expanded: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("landed") || s.includes("arrived")) return "#22c55e";
  if (s.includes("boarding") || s.includes("gate")) return "#3b82f6";
  if (s.includes("departed") || s.includes("airborne") || s.includes("en route")) return "#a78bfa";
  if (s.includes("delay") || s.includes("diverted")) return "#f59e0b";
  if (s.includes("cancel")) return "#ef4444";
  if (s.includes("scheduled")) return "#94a3b8";
  return "#cbd5e1";
}

function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("landed") || s.includes("arrived")) return "Landed";
  if (s.includes("boarding")) return "Boarding";
  if (s.includes("gate")) return "At Gate";
  if (s.includes("airborne") || s.includes("en route")) return "Airborne";
  if (s.includes("departed")) return "Departed";
  if (s.includes("delay")) return "Delayed";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("diverted")) return "Diverted";
  if (s.includes("scheduled")) return "Scheduled";
  return status;
}

function statusEmoji(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("landed") || s.includes("arrived")) return "🟢";
  if (s.includes("boarding")) return "🚶";
  if (s.includes("gate")) return "🚪";
  if (s.includes("departed") || s.includes("airborne") || s.includes("en route")) return "✈️";
  if (s.includes("delay")) return "⏳";
  if (s.includes("cancel")) return "❌";
  if (s.includes("diverted")) return "↩️";
  return "🕐";
}

function formatLocalTime(iso: string | null): string {
  if (!iso) return "–";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.replace("T", " ").slice(0, 16);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16);
  }
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "–";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso.slice(0, 10);
  }
}

function delayMinutes(scheduled: string | null, revised: string | null): number {
  if (!scheduled || !revised) return 0;
  try {
    const s = new Date(scheduled).getTime();
    const r = new Date(revised).getTime();
    return Math.round((r - s) / 60000);
  } catch {
    return 0;
  }
}

function getAirlineLogoUrl(iata: string | null): string | null {
  if (!iata) return null;
  return `https://pics.avs.io/60/60/${iata}.png`;
}

function mockWeather(iata: string | null): { temp: number; condition: string; wind: number; emoji: string } {
  if (!iata) return { temp: 20, condition: "Clear", wind: 12, emoji: "☀️" };
  let hash = 0;
  for (let i = 0; i < iata.length; i++) hash = (hash * 31 + iata.charCodeAt(i)) & 0xffff;
  const conditions = [
    { condition: "Sunny", emoji: "☀️" },
    { condition: "Partly Cloudy", emoji: "⛅" },
    { condition: "Overcast", emoji: "☁️" },
    { condition: "Light Rain", emoji: "🌦️" },
    { condition: "Clear", emoji: "🌙" },
  ];
  const idx = hash % conditions.length;
  const temp = 15 + (hash % 14);
  const wind = 5 + ((hash >> 4) % 25);
  return { temp, wind, ...conditions[idx] };
}

function flightProgress(dep: AirportInfo | null, arr: AirportInfo | null): number {
  if (!dep || !arr) return 0;
  const depTime = dep.revised || dep.scheduled;
  const arrTime = arr.revised || arr.scheduled;
  if (!depTime || !arrTime) return 0;
  try {
    const d = new Date(depTime).getTime();
    const a = new Date(arrTime).getTime();
    const now = Date.now();
    if (now <= d) return 0;
    if (now >= a) return 100;
    return Math.round(((now - d) / (a - d)) * 100);
  } catch {
    return 0;
  }
}

function elapsedRemaining(dep: AirportInfo | null, arr: AirportInfo | null): { elapsed: string; remaining: string } {
  if (!dep || !arr) return { elapsed: "–", remaining: "–" };
  const depTime = dep.revised || dep.scheduled;
  const arrTime = arr.revised || arr.scheduled;
  if (!depTime || !arrTime) return { elapsed: "–", remaining: "–" };
  try {
    const d = new Date(depTime).getTime();
    const a = new Date(arrTime).getTime();
    const now = Date.now();
    const elapsedMs = Math.max(0, now - d);
    const remainingMs = Math.max(0, a - now);
    const fmt = (ms: number) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    return { elapsed: fmt(elapsedMs), remaining: fmt(remainingMs) };
  } catch {
    return { elapsed: "–", remaining: "–" };
  }
}

function isAirborne(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes("airborne") || s.includes("en route") || s.includes("departed");
}

function mockWalkTime(terminal: string | null): number {
  if (!terminal) return 5;
  const code = terminal.charCodeAt(0) || 65;
  return 3 + (code % 6);
}

function mockLounge(terminal: string | null): string {
  if (!terminal) return "Terminal — Priority Pass lounge available";
  return `Terminal ${terminal} — Priority Pass & AmEx Centurion lounges available`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, accent, bold, dim }: {
  label: string; value: string; accent?: string; bold?: boolean; dim?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, gap: 8 }}>
      <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, flexShrink: 0, textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{
        color: dim ? "#475569" : accent || "#e2e8f0",
        fontWeight: bold ? 700 : 500,
        fontSize: 13,
        textAlign: "right",
        fontFamily: bold ? "monospace" : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#475569", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function AirportPanel({ side, info, delay }: { side: "DEP" | "ARR"; info: AirportInfo | null; delay: number }) {
  const isArr = side === "ARR";
  const time = info?.revised || info?.scheduled;
  const isDelayed = Math.abs(delay) >= 5;
  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ color: "#475569", fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
        {isArr ? "▸ Arrival" : "▸ Departure"}
      </div>
      <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 26, fontFamily: "Georgia, serif", letterSpacing: 2, marginBottom: 2 }}>
        {info?.iata || "???"}
      </div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 14, lineHeight: 1.3 }}>
        {info?.city || info?.airport || "Unknown Airport"}
      </div>
      <InfoRow label="Time" value={formatLocalTime(time)} accent={isDelayed ? "#f59e0b" : undefined} />
      <InfoRow label="Date" value={formatFullDate(time)} />
      {isDelayed && <InfoRow label="Delay" value={`+${delay} min`} accent="#f59e0b" />}
      {info?.terminal && <InfoRow label="Terminal" value={info.terminal} />}
      {info?.gate ? (
        <InfoRow label="Gate" value={info.gate} accent="#fbbf24" bold />
      ) : (
        <InfoRow label="Gate" value="Not yet assigned" dim />
      )}
      {!isArr && info?.checkInDesk && <InfoRow label="Check-in" value={info.checkInDesk} />}
      {isArr && info?.baggageBelt && <InfoRow label="Baggage Belt" value={info.baggageBelt} />}
      {info?.runwayTime && <InfoRow label="Runway Time" value={formatLocalTime(info.runwayTime)} />}
    </div>
  );
}

function FlightPathAnimation({ depIata, arrIata }: { depIata: string | null; arrIata: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "18px 20px 10px", position: "relative" }}>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20, color: GOLD, letterSpacing: 2 }}>
        {depIata || "???"}
      </span>
      <div style={{ flex: 1, position: "relative", height: 24, display: "flex", alignItems: "center", margin: "0 14px", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%", height: 2,
          background: `repeating-linear-gradient(90deg, ${GOLD} 0px, ${GOLD} 6px, transparent 6px, transparent 14px)`,
          transform: "translateY(-50%)", opacity: 0.35,
        }} />
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          fontSize: 15, animation: "planeFly 3.5s linear infinite", zIndex: 2,
        }}>✈️</div>
      </div>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20, color: GOLD, letterSpacing: 2 }}>
        {arrIata || "???"}
      </span>
    </div>
  );
}

function TimelineBar({ dep, arr }: { dep: AirportInfo | null; arr: AirportInfo | null }) {
  const pct = flightProgress(dep, arr);
  const { elapsed, remaining } = elapsedRemaining(dep, arr);
  const depTime = formatLocalTime(dep?.revised || dep?.scheduled);
  const arrTime = formatLocalTime(arr?.revised || arr?.scheduled);
  return (
    <div style={{ padding: "0 20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 8 }}>
        <span>🛫 {depTime}</span>
        <span style={{ color: "#334155" }}>Elapsed: {elapsed} · Remaining: {remaining}</span>
        <span>🛬 {arrTime}</span>
      </div>
      <div style={{ position: "relative", height: 5, background: "#1e293b", borderRadius: 99 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, #7c3aed, ${GOLD})`,
          borderRadius: 99, transition: "width 0.8s ease",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)", width: 13, height: 13,
          background: GOLD, borderRadius: "50%",
          boxShadow: `0 0 10px ${GOLD}99`,
          animation: "pulseDot 1.5s ease-in-out infinite", zIndex: 3,
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 7, fontSize: 10, color: "#334155", letterSpacing: 0.5 }}>
        {pct}% of journey complete
      </div>
    </div>
  );
}

function DelayImpactStrip({ arrDelay }: { arrDelay: number }) {
  let bg: string, border: string, color: string, message: string;
  if (arrDelay > 60) {
    bg = "#450a0a18"; border = "#7f1d1d60"; color = "#fca5a5";
    message = "⚠️ Likely to miss connection — recommend notifying client immediately";
  } else if (arrDelay >= 15) {
    bg = "#451a0318"; border = "#78350f60"; color = "#fcd34d";
    message = "⏳ Moderate delay — may impact transfers, monitor closely";
  } else {
    bg = "#052e1618"; border = "#14532d60"; color = "#86efac";
    message = "✅ On schedule — all connections nominal";
  }
  return (
    <div style={{
      margin: "0 20px 16px", background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: "10px 16px", color, fontSize: 12, fontWeight: 600,
    }}>
      {message}
    </div>
  );
}

function WeatherCard({ iata, city }: { iata: string | null; city: string | null }) {
  const w = mockWeather(iata);
  return (
    <div style={{
      flex: "1 1 0", background: "linear-gradient(135deg, #0a1220 0%, #0f1f38 100%)",
      border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
        {iata || "???"} · {city || "Unknown"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{w.emoji}</span>
        <div>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 20 }}>{w.temp}°C</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>{w.condition}</div>
        </div>
      </div>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 8 }}>💨 Wind {w.wind} km/h</div>
    </div>
  );
}

function WeatherPreview({ dep, arr }: { dep: AirportInfo | null; arr: AirportInfo | null }) {
  return (
    <div style={{ margin: "0 20px 16px" }}>
      <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>
        Destination Weather Preview
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <WeatherCard iata={dep?.iata ?? null} city={dep?.city ?? null} />
        <WeatherCard iata={arr?.iata ?? null} city={arr?.city ?? null} />
      </div>
    </div>
  );
}

function AircraftTerminalCard({ data }: { data: FlightData }) {
  const walkTime = mockWalkTime(data.departure?.terminal ?? null);
  const lounge = mockLounge(data.departure?.terminal ?? null);
  return (
    <div style={{
      margin: "0 20px 16px",
      background: "linear-gradient(135deg, #080e1c 0%, #0d1c38 100%)",
      border: `1px solid ${GOLD}35`,
      borderRadius: 14, padding: "18px 20px",
      boxShadow: `0 0 24px ${GOLD}10`,
    }}>
      <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
        ✦ Aircraft & Terminal Intelligence
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
        <div>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Aircraft Type</div>
          <div style={{ color: "#e2e8f0", fontSize: 14, marginTop: 3, fontWeight: 600 }}>{data.aircraft || "–"}</div>
        </div>
        <div>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Registration</div>
          <div style={{ color: "#e2e8f0", fontSize: 14, marginTop: 3, fontFamily: "monospace" }}>{data.registration || "–"}</div>
        </div>
        {data.departure?.terminal && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Terminal Access</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 3 }}>
              Terminal {data.departure.terminal} — approx. {walkTime} min walk to gate
            </div>
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Lounge Access</div>
          <div style={{ color: GOLD, fontSize: 13, marginTop: 3, fontWeight: 500 }}>🥂 {lounge}</div>
        </div>
      </div>
    </div>
  );
}

function FollowToggle({ flightNumber }: { flightNumber: string }) {
  const [followed, setFollowed] = useState(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(FOLLOWED_KEY) || "[]");
      return saved.includes(flightNumber);
    } catch { return false; }
  });

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !followed;
    setFollowed(next);
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(FOLLOWED_KEY) || "[]");
      const updated = next ? [...saved.filter(f => f !== flightNumber), flightNumber] : saved.filter(f => f !== flightNumber);
      localStorage.setItem(FOLLOWED_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div
      onClick={toggle}
      style={{
        display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
        padding: "5px 11px", borderRadius: 20,
        background: followed ? `${GOLD}18` : "transparent",
        border: `1px solid ${followed ? GOLD + "60" : "#2d3f5a"}`,
        transition: "all 0.2s", userSelect: "none",
      }}
    >
      <div style={{
        width: 26, height: 14, borderRadius: 99,
        background: followed ? GOLD : "#1e293b",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: followed ? 13 : 2, width: 10, height: 10,
          background: "#fff", borderRadius: "50%", transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: followed ? GOLD : "#475569", whiteSpace: "nowrap" }}>
        {followed ? "⭐ Following" : "Follow trip"}
      </span>
    </div>
  );
}

// ─── Flight Card ──────────────────────────────────────────────────────────────

function FlightCard({ tf, onRemove, onToggleExpand }: {
  tf: TrackedFlight;
  onRemove: (fn: string) => void;
  onToggleExpand: (fn: string) => void;
}) {
  const { data, loading, error, serverMessage, lastUpdated, expanded } = tf;
  const [hovered, setHovered] = useState(false);

  const depDelay = data ? delayMinutes(data.departure?.scheduled ?? null, data.departure?.revised ?? null) : 0;
  const arrDelay = data ? delayMinutes(data.arrival?.scheduled ?? null, data.arrival?.revised ?? null) : 0;
  const airborne = data ? isAirborne(data.status) : false;
  const sColor = data ? statusColor(data.status) : "#334155";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(160deg, #0a0f1e 0%, #0f1929 50%, #121e35 100%)",
        border: `1px solid ${data ? sColor + "45" : "#1e2d45"}`,
        borderRadius: 20, marginBottom: 18, overflow: "hidden",
        boxShadow: hovered
          ? `0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px ${sColor}25`
          : `0 4px 20px rgba(0,0,0,0.5)`,
        transition: "box-shadow 0.3s, transform 0.25s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: "fadeInCard 0.4s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", padding: "16px 18px",
          gap: 12, cursor: "pointer", userSelect: "none",
          borderBottom: expanded || (!loading && !error && data) ? "1px solid #141e30" : "none",
        }}
        onClick={() => onToggleExpand(tf.flightNumber)}
      >
        {/* Airline logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, #162a50, #0d1e38)",
          border: `1px solid ${GOLD}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          {data?.airlineIata ? (
            <img
              src={getAirlineLogoUrl(data.airlineIata)!}
              alt={data.airline || ""}
              style={{ width: 34, height: 34, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span style={{ fontSize: 20 }}>✈️</span>
          )}
        </div>

        {/* Flight info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 17, letterSpacing: 1.5, fontFamily: "Georgia, serif" }}>
              {tf.flightNumber}
            </span>
            {data && airborne && (
              <span style={{
                display: "inline-block", width: 7, height: 7,
                background: "#4ade80", borderRadius: "50%",
                animation: "pulseGreen 1.5s ease-in-out infinite",
                boxShadow: "0 0 6px #4ade80",
              }} />
            )}
            {data && (
              <span style={{
                background: sColor + "20", color: sColor,
                border: `1px solid ${sColor}50`,
                borderRadius: 99, padding: "2px 9px",
                fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
              }}>
                {statusEmoji(data.status)} {statusLabel(data.status)}
              </span>
            )}
          </div>
          <div style={{ color: "#4d6480", fontSize: 12, marginTop: 3 }}>
            {loading ? "Fetching flight data…" : data
              ? `${data.airline || "Unknown Airline"}${data.aircraft ? ` · ${data.aircraft}` : ""}`
              : error ? "Flight not found" : "–"}
          </div>
        </div>

        {/* Route */}
        {data?.departure && data?.arrival && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            color: GOLD, fontSize: 14, fontWeight: 800,
            fontFamily: "Georgia, serif", flexShrink: 0, letterSpacing: 1,
          }}>
            {data.departure.iata || "???"} <span style={{ color: "#1e3050", fontSize: 10 }}>→</span> {data.arrival.iata || "???"}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
          {data && <div onClick={e => e.stopPropagation()}><FollowToggle flightNumber={tf.flightNumber} /></div>}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(tf.flightNumber); }}
            style={{
              background: "transparent", border: "1px solid #1e2d45",
              borderRadius: 8, color: "#475569", padding: "5px 9px",
              cursor: "pointer", fontSize: 12, transition: "border-color 0.2s",
            }}
            title="Remove"
          >✕</button>
          <div style={{
            background: "transparent", border: "1px solid #1e2d45",
            borderRadius: 8, color: "#475569", padding: "5px 9px", fontSize: 12,
            display: "flex", alignItems: "center",
          }}>
            {expanded ? "▲" : "▼"}
          </div>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div style={{ padding: "16px 20px 20px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 12, borderRadius: 6, marginBottom: 10,
              width: i === 3 ? "50%" : "100%",
              background: "linear-gradient(90deg, #1a2535 25%, #222f45 50%, #1a2535 75%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
            }} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{
            background: "#2a0808", border: "1px solid #5a1a1a",
            borderRadius: 12, padding: "14px 18px",
            color: "#fca5a5", fontSize: 14, lineHeight: 1.5,
          }}>
            <strong>✈️ {error}</strong>
            {serverMessage && <div style={{ marginTop: 6, color: "#f87171", fontSize: 12 }}>{serverMessage}</div>}
          </div>
        </div>
      )}

      {/* Collapsed quick-glance bar */}
      {!loading && !error && data && !expanded && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            { label: "Gate", value: data.departure?.gate || "TBA", highlight: !!data.departure?.gate },
            { label: "Terminal", value: data.departure?.terminal || "TBA", highlight: false },
            { label: "Departs", value: formatLocalTime(data.departure?.revised || data.departure?.scheduled), highlight: !!data.departure?.revised && depDelay > 0 },
            { label: "Arrives", value: formatLocalTime(data.arrival?.revised || data.arrival?.scheduled), highlight: !!data.arrival?.revised && arrDelay > 0 },
          ].map((item, i) => (
            <div key={i} style={{
              flex: "1 1 80px", padding: "12px 14px",
              borderRight: i < 3 ? "1px solid #111c2c" : "none",
              textAlign: "center",
            }}>
              <div style={{ color: "#2d3f5a", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5, textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ color: item.highlight ? "#fbbf24" : "#cbd5e1", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {!loading && !error && data && expanded && (
        <div>
          <FlightPathAnimation depIata={data.departure?.iata ?? null} arrIata={data.arrival?.iata ?? null} />
          <TimelineBar dep={data.departure} arr={data.arrival} />
          <DelayImpactStrip arrDelay={arrDelay} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", borderTop: "1px solid #111c2c" }}>
            <AirportPanel side="DEP" info={data.departure} delay={depDelay} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 6px", color: "#1e3050" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>✈️</div>
              <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, #1e3050, transparent)" }} />
            </div>
            <AirportPanel side="ARR" info={data.arrival} delay={arrDelay} />
          </div>

          <WeatherPreview dep={data.departure} arr={data.arrival} />
          <AircraftTerminalCard data={data} />

          {data.live && (
            <div style={{
              margin: "0 20px 16px", background: "#091830",
              border: "1px solid #1a3050", borderRadius: 12,
              padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 20,
            }}>
              <LiveStat label="Altitude" value={data.live.altitude ? `${data.live.altitude.toLocaleString()} ft` : "–"} />
              <LiveStat label="Speed" value={data.live.speed ? `${Math.round(data.live.speed)} km/h` : "–"} />
              <LiveStat label="Position" value={data.live.lat && data.live.lon ? `${data.live.lat.toFixed(2)}°, ${data.live.lon.toFixed(2)}°` : "–"} />
              <LiveStat label="Status" value={data.live.isGround ? "On Ground" : "Airborne"} />
            </div>
          )}

          {lastUpdated && (
            <div style={{ padding: "0 20px 14px", textAlign: "right" }}>
              <span style={{ color: "#1e3050", fontSize: 10, letterSpacing: 0.3 }}>
                Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recent searches ──────────────────────────────────────────────────────────

function RecentPills({ current, onAdd }: { current: string[]; onAdd: (fn: string) => void }) {
  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("cb_recent_searches") || "[]");
      setRecents(saved.filter(f => !current.includes(f)).slice(0, 6));
    } catch {}
  }, [current.join(",")]);
  if (recents.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
      <span style={{ fontSize: 10, color: "#2d3f5a", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Recent:</span>
      {recents.map(fn => (
        <button
          key={fn}
          onClick={() => onAdd(fn)}
          style={{
            background: `${GOLD}12`, border: `1px solid ${GOLD}35`,
            borderRadius: 20, color: GOLD,
            padding: "4px 12px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "monospace", letterSpacing: 0.5,
          }}
        >{fn}</button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlightManager() {
  useSEO({
    title: 'Live Flight Tracker',
    description: "Track any flight live with CB Travel's flight tracker. Real-time status, departure and arrival information at your fingertips.",
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const flightNumbers: string[] = JSON.parse(saved);
        const initial: TrackedFlight[] = flightNumbers.map((fn) => ({
          flightNumber: fn, data: null, loading: true,
          error: null, serverMessage: null, lastUpdated: null, expanded: false,
        }));
        setTrackedFlights(initial);
        initial.forEach((tf) => fetchFlight(tf.flightNumber));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const numbers = trackedFlights.map((tf) => tf.flightNumber);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
  }, [trackedFlights.map((tf) => tf.flightNumber).join(",")]);

  useEffect(() => {
    if (trackedFlights.length === 0) return;
    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return REFRESH_INTERVAL;
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [trackedFlights.length]);

  const fetchFlight = useCallback(async (flightNumber: string) => {
    setTrackedFlights((prev) =>
      prev.map((tf) => tf.flightNumber === flightNumber ? { ...tf, loading: true, error: null, serverMessage: null } : tf)
    );
    try {
      const res = await fetch(`${API_BASE}/api/flight-status?flight=${encodeURIComponent(flightNumber)}`);
      const json = await res.json();
      if (!res.ok) {
        setTrackedFlights((prev) =>
          prev.map((tf) => tf.flightNumber === flightNumber
            ? { ...tf, loading: false, error: json.error || "Unable to fetch flight data", serverMessage: json.message || null, lastUpdated: new Date() }
            : tf)
        );
        return;
      }
      const flightData: FlightData | null = json.data && json.data.length > 0 ? json.data[0] : null;
      setTrackedFlights((prev) =>
        prev.map((tf) => tf.flightNumber === flightNumber
          ? { ...tf, data: flightData, loading: false, error: flightData ? null : "No flight data returned", serverMessage: null, lastUpdated: new Date() }
          : tf)
      );
    } catch {
      setTrackedFlights((prev) =>
        prev.map((tf) => tf.flightNumber === flightNumber
          ? { ...tf, loading: false, error: "Network error — could not reach server", serverMessage: null, lastUpdated: new Date() }
          : tf)
      );
    }
  }, []);

  const handleAddFlight = (overrideFn?: string) => {
    const fn = (overrideFn || searchInput).replace(/\s+/g, "").toUpperCase().trim();
    if (!fn) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("cb_recent_searches") || "[]");
      const updated = [fn, ...saved.filter(f => f !== fn)].slice(0, 10);
      localStorage.setItem("cb_recent_searches", JSON.stringify(updated));
    } catch {}
    if (trackedFlights.find((tf) => tf.flightNumber === fn)) { setSearchInput(""); return; }
    setTrackedFlights((prev) => [
      ...prev,
      { flightNumber: fn, data: null, loading: true, error: null, serverMessage: null, lastUpdated: null, expanded: true },
    ]);
    fetchFlight(fn);
    setSearchInput("");
  };

  const handleRemove = (fn: string) => {
    setTrackedFlights((prev) => prev.filter((tf) => tf.flightNumber !== fn));
  };

  const handleToggleExpand = (fn: string) => {
    setTrackedFlights((prev) =>
      prev.map((tf) => tf.flightNumber === fn ? { ...tf, expanded: !tf.expanded } : tf)
    );
  };

  const handleRefreshAll = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await Promise.all(trackedFlights.map((tf) => fetchFlight(tf.flightNumber)));
    setIsRefreshing(false);
  }, [trackedFlights, isRefreshing, fetchFlight]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #020917 0%, #050e1e 30%, #08142a 100%)",
      color: "#f1f5f9",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 80,
      paddingTop: 72,
    }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: "linear-gradient(160deg, #040c1c 0%, #070f22 35%, #0a1830 65%, #060c1a 100%)",
        borderBottom: `1px solid ${GOLD}25`,
        padding: "90px 24px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: -100, left: "30%", width: 500, height: 350,
          background: `radial-gradient(ellipse, ${GOLD}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -50, right: "20%", width: 300, height: 200,
          background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            {/* Eyebrow */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
              borderRadius: 99, padding: "6px 16px", marginBottom: 18,
            }}>
              <span style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
                ✦ CB Travel · Concierge Intelligence ✦
              </span>
            </div>

            <h1 style={{
              margin: "0 0 10px",
              fontSize: 44,
              fontWeight: 700,
              fontFamily: "Georgia, 'Times New Roman', serif",
              background: `linear-gradient(135deg, #e2e8f0 0%, ${GOLD} 45%, #e2e8f0 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}>
              Live Flight Tracking
            </h1>
            <p style={{ margin: 0, color: "#3d5a7a", fontSize: 14, letterSpacing: 0.3, lineHeight: 1.7 }}>
              Gate info, real-time status, delays & terminal intelligence — all in one view
            </p>
          </div>

          {/* Search bar */}
          <div style={{
            display: "flex", gap: 8,
            background: "#070f22",
            border: `2px solid ${searchFocused ? GOLD : GOLD + "30"}`,
            borderRadius: 16, padding: "5px 5px 5px 18px",
            boxShadow: searchFocused
              ? `0 0 40px ${GOLD}30, 0 0 80px ${GOLD}10`
              : `0 0 30px rgba(0,0,0,0.5)`,
            transition: "box-shadow 0.3s, border-color 0.3s",
          }}>
            <span style={{ color: GOLD, fontSize: 18, display: "flex", alignItems: "center", flexShrink: 0 }}>✈️</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFlight()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Flight number (e.g. BA2490, VS401, EZY8432)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#f1f5f9", fontSize: 15, fontFamily: "monospace",
                letterSpacing: 0.5, padding: "10px 0",
              }}
            />
            <button
              onClick={() => handleAddFlight()}
              disabled={!searchInput.trim()}
              style={{
                background: searchInput.trim() ? `linear-gradient(135deg, ${GOLD}, #a07830)` : "#0f1e35",
                border: "none", borderRadius: 12,
                color: searchInput.trim() ? "#06111e" : "#2d3f5a",
                padding: "10px 22px", fontWeight: 800, fontSize: 13,
                cursor: searchInput.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: 0.5,
              }}
            >
              Track Flight
            </button>
          </div>

          <RecentPills current={trackedFlights.map(tf => tf.flightNumber)} onAdd={(fn) => handleAddFlight(fn)} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Refresh bar */}
        {trackedFlights.length > 0 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 18, padding: "10px 16px",
            background: "#070f22", borderRadius: 12, border: "1px solid #111e32",
          }}>
            <span style={{ color: "#2d3f5a", fontSize: 12 }}>
              Tracking <span style={{ color: GOLD, fontWeight: 700 }}>{trackedFlights.length}</span> flight{trackedFlights.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => { setRefreshCountdown(REFRESH_INTERVAL); handleRefreshAll(); }}
              style={{
                background: "transparent", border: `1px solid ${GOLD}30`,
                borderRadius: 8, color: isRefreshing ? GOLD : "#2d3f5a",
                padding: "5px 13px", cursor: "pointer", fontSize: 11,
                display: "flex", alignItems: "center", gap: 5, fontWeight: 600,
              }}
            >
              {isRefreshing ? "Refreshing…" : (
                <>
                  <span style={{ animation: "spin 2s linear infinite", display: "inline-block" }}>⟳</span>
                  Refresh in {refreshCountdown}s
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty state */}
        {trackedFlights.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#1e3050" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
              background: `linear-gradient(135deg, ${GOLD}15, ${GOLD}05)`,
              border: `1px solid ${GOLD}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}>
              ✈️
            </div>
            <div style={{
              fontSize: 22, fontWeight: 600, color: "#2d4060", marginBottom: 10,
              fontFamily: "Georgia, serif", letterSpacing: -0.3,
            }}>
              No flights tracked yet
            </div>
            <div style={{ fontSize: 13, color: "#1e3050", lineHeight: 1.8, maxWidth: 320, margin: "0 auto" }}>
              Enter a flight number above to get live gate information,
              departure times, delay alerts, and real-time status.
            </div>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {["BA2490", "VS401", "EZY8432", "LH2345"].map(fn => (
                <button
                  key={fn}
                  onClick={() => { setSearchInput(fn); handleAddFlight(fn); }}
                  style={{
                    background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                    borderRadius: 99, color: GOLD, padding: "6px 14px",
                    fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                    cursor: "pointer", letterSpacing: 0.5,
                  }}
                >
                  {fn}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: 11, color: "#1a2a40" }}>
              Tap any example above to track it instantly
            </p>
          </div>
        )}

        {/* Flight cards */}
        {trackedFlights.map((tf) => (
          <FlightCard
            key={tf.flightNumber}
            tf={tf}
            onRemove={handleRemove}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
          50%       { opacity: 0.4; box-shadow: 0 0 14px #4ade80; }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 8px ${GOLD}99; transform: translate(-50%, -50%) scale(1); }
          50%       { box-shadow: 0 0 20px ${GOLD}; transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes planeFly {
          0%   { left: 0%;                opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { left: calc(100% - 18px); opacity: 0; }
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #1e3050; }
      `}</style>
    </div>
  );
}
