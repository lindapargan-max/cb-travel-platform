import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const STORAGE_KEY = "cb_tracked_flights";
const FOLLOWED_KEY = "cb_followed_flights";
const REFRESH_INTERVAL = 60; // seconds
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Deterministic "random" weather based on airport code
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

// Mocked terminal walk time: deterministic based on terminal char
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

function Row({ label, value, accent, bold, dim }: {
  label: string; value: string; accent?: string; bold?: boolean; dim?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
      <span style={{ color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, flexShrink: 0 }}>
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
      <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{label}</div>
      <div style={{ color: "#7dd3fc", fontWeight: 700, fontSize: 14, fontFamily: "monospace", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function AirportPanel({ side, info, delay }: { side: "DEP" | "ARR"; info: AirportInfo | null; delay: number }) {
  const isArr = side === "ARR";
  const time = info?.revised || info?.scheduled;
  const isDelayed = Math.abs(delay) >= 5;
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>
        {isArr ? "ARRIVAL" : "DEPARTURE"}
      </div>
      <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 22, fontFamily: "monospace", marginBottom: 2 }}>
        {info?.iata || "???"}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
        {info?.city || info?.airport || "Unknown Airport"}
      </div>
      <Row label="TIME" value={formatLocalTime(time)} accent={isDelayed ? "#f59e0b" : undefined} />
      <Row label="DATE" value={formatFullDate(time)} />
      {isDelayed && <Row label="DELAY" value={`+${delay} min`} accent="#f59e0b" />}
      {info?.terminal && <Row label="TERMINAL" value={info.terminal} />}
      {info?.gate ? (
        <Row label="GATE" value={info.gate} accent="#fbbf24" bold />
      ) : (
        <Row label="GATE" value="Not yet assigned" dim />
      )}
      {!isArr && info?.checkInDesk && <Row label="CHECK-IN" value={info.checkInDesk} />}
      {isArr && info?.baggageBelt && <Row label="BAGGAGE BELT" value={info.baggageBelt} />}
      {info?.runwayTime && <Row label="RUNWAY TIME" value={formatLocalTime(info.runwayTime)} />}
    </div>
  );
}

// ─── Flight Path Animation ────────────────────────────────────────────────────

function FlightPathAnimation({ depIata, arrIata }: { depIata: string | null; arrIata: string | null }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      padding: "18px 20px 10px",
      position: "relative",
    }}>
      <span style={{
        fontFamily: "monospace",
        fontWeight: 800,
        fontSize: 22,
        color: GOLD,
        letterSpacing: 2,
      }}>{depIata || "???"}</span>

      <div style={{
        flex: 1,
        position: "relative",
        height: 24,
        display: "flex",
        alignItems: "center",
        margin: "0 12px",
        overflow: "hidden",
      }}>
        {/* Dashed line */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 2,
          background: `repeating-linear-gradient(90deg, ${GOLD} 0px, ${GOLD} 8px, transparent 8px, transparent 18px)`,
          transform: "translateY(-50%)",
          opacity: 0.45,
        }} />
        {/* Animated plane */}
        <div style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16,
          animation: "planeFly 3.5s linear infinite",
          zIndex: 2,
        }}>✈️</div>
      </div>

      <span style={{
        fontFamily: "monospace",
        fontWeight: 800,
        fontSize: 22,
        color: GOLD,
        letterSpacing: 2,
      }}>{arrIata || "???"}</span>
    </div>
  );
}

// ─── Timeline Progress Bar ────────────────────────────────────────────────────

function TimelineBar({ dep, arr }: { dep: AirportInfo | null; arr: AirportInfo | null }) {
  const pct = flightProgress(dep, arr);
  const { elapsed, remaining } = elapsedRemaining(dep, arr);
  const depTime = formatLocalTime(dep?.revised || dep?.scheduled);
  const arrTime = formatLocalTime(arr?.revised || arr?.scheduled);

  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#64748b",
        marginBottom: 6,
      }}>
        <span>🛫 {depTime}</span>
        <span style={{ color: "#94a3b8" }}>Elapsed: {elapsed} · Remaining: {remaining}</span>
        <span>🛬 {arrTime}</span>
      </div>
      {/* Track */}
      <div style={{
        position: "relative",
        height: 6,
        background: "#1e293b",
        borderRadius: 99,
        overflow: "visible",
      }}>
        {/* Fill */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, #7c3aed, ${GOLD})`,
          borderRadius: 99,
          transition: "width 0.8s ease",
        }} />
        {/* Dot at current position */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 14,
          height: 14,
          background: GOLD,
          borderRadius: "50%",
          boxShadow: `0 0 10px ${GOLD}99`,
          animation: "pulseDot 1.5s ease-in-out infinite",
          zIndex: 3,
        }} />
        {/* End dot */}
        <div style={{
          position: "absolute",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          width: 10,
          height: 10,
          background: "#334155",
          borderRadius: "50%",
          border: "2px solid #475569",
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "#475569" }}>
        {pct}% complete
      </div>
    </div>
  );
}

// ─── Delay Impact Strip ───────────────────────────────────────────────────────

function DelayImpactStrip({ arrDelay }: { arrDelay: number }) {
  let bg: string, border: string, color: string, message: string;
  if (arrDelay > 60) {
    bg = "#450a0a22"; border = "#7f1d1d80"; color = "#fca5a5";
    message = "⚠️ Likely to miss connection — notify client";
  } else if (arrDelay >= 15) {
    bg = "#451a0322"; border = "#78350f80"; color = "#fcd34d";
    message = "⏳ Delay may impact transfer — monitor closely";
  } else {
    bg = "#052e1622"; border = "#14532d80"; color = "#86efac";
    message = "✅ On track — all connections nominal";
  }
  return (
    <div style={{
      margin: "0 20px 16px",
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: "10px 16px",
      color,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 0.3,
    }}>
      {message}
    </div>
  );
}

// ─── Weather Preview ──────────────────────────────────────────────────────────

function WeatherCard({ iata, city }: { iata: string | null; city: string | null }) {
  const w = mockWeather(iata);
  return (
    <div style={{
      flex: "1 1 0",
      background: "linear-gradient(135deg, #0a1628 0%, #0f2240 100%)",
      border: `1px solid #1e3a5f`,
      borderRadius: 12,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
        {iata || "???"} · {city || "Unknown"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{w.emoji}</span>
        <div>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 20 }}>{w.temp}°C</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>{w.condition}</div>
        </div>
      </div>
      <div style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>💨 Wind {w.wind} km/h</div>
    </div>
  );
}

function WeatherPreview({ dep, arr }: { dep: AirportInfo | null; arr: AirportInfo | null }) {
  return (
    <div style={{ margin: "0 20px 16px" }}>
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
        WEATHER PREVIEW
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <WeatherCard iata={dep?.iata ?? null} city={dep?.city ?? null} />
        <WeatherCard iata={arr?.iata ?? null} city={arr?.city ?? null} />
      </div>
    </div>
  );
}

// ─── Aircraft & Terminal Card ─────────────────────────────────────────────────

function AircraftTerminalCard({ data }: { data: FlightData }) {
  const walkTime = mockWalkTime(data.departure?.terminal ?? null);
  const lounge = mockLounge(data.departure?.terminal ?? null);
  return (
    <div style={{
      margin: "0 20px 16px",
      background: "linear-gradient(135deg, #0a0f1a 0%, #0f1f3a 100%)",
      border: `1px solid ${GOLD}40`,
      borderRadius: 14,
      padding: "18px 20px",
      boxShadow: `0 0 20px ${GOLD}15`,
    }}>
      <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 1.5, marginBottom: 14 }}>
        ✦ AIRCRAFT & TERMINAL INTELLIGENCE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
        <div>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>AIRCRAFT TYPE</div>
          <div style={{ color: "#e2e8f0", fontSize: 14, marginTop: 3, fontWeight: 600 }}>{data.aircraft || "–"}</div>
        </div>
        <div>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>REGISTRATION</div>
          <div style={{ color: "#e2e8f0", fontSize: 14, marginTop: 3, fontFamily: "monospace" }}>{data.registration || "–"}</div>
        </div>
        {data.departure?.terminal && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>TERMINAL ACCESS</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 3 }}>
              Terminal {data.departure.terminal} — approximately {walkTime} min walk to gate
            </div>
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>LOUNGE ACCESS</div>
          <div style={{ color: GOLD, fontSize: 13, marginTop: 3, fontWeight: 500 }}>🥂 {lounge}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Follow Toggle ────────────────────────────────────────────────────────────

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
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: 20,
        background: followed ? `${GOLD}20` : "#1e293b",
        border: `1px solid ${followed ? GOLD + "80" : "#334155"}`,
        transition: "all 0.2s",
        userSelect: "none",
      }}
    >
      <div style={{
        width: 28,
        height: 16,
        borderRadius: 99,
        background: followed ? GOLD : "#334155",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}>
        <div style={{
          position: "absolute",
          top: 2,
          left: followed ? 14 : 2,
          width: 12,
          height: 12,
          background: "#fff",
          borderRadius: "50%",
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: followed ? GOLD : "#64748b", whiteSpace: "nowrap" }}>
        {followed ? "⭐ Following" : "Follow this trip"}
      </span>
    </div>
  );
}

// ─── Flight Card ──────────────────────────────────────────────────────────────

function FlightCard({
  tf,
  onRemove,
  onToggleExpand,
}: {
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
        background: "linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #1a2035 100%)",
        border: `1px solid ${data ? sColor + "50" : "#334155"}`,
        borderRadius: 18,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: hovered
          ? `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${sColor}30`
          : `0 4px 24px rgba(0,0,0,0.4)`,
        transition: "box-shadow 0.3s, transform 0.2s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: "fadeInCard 0.4s ease-out",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "18px 20px",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
          borderBottom: expanded || (!loading && !error && data) ? `1px solid #1e2a40` : "none",
        }}
        onClick={() => onToggleExpand(tf.flightNumber)}
      >
        {/* Logo / Icon */}
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: "linear-gradient(135deg, #1a3a6a, #0f2244)",
          border: `1px solid ${GOLD}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}>
          {data?.airlineIata ? (
            <img
              src={getAirlineLogoUrl(data.airlineIata)!}
              alt={data.airline || ""}
              style={{ width: 36, height: 36, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>✈️</span>
          )}
        </div>

        {/* Flight number + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: 18, letterSpacing: 1.5, fontFamily: "Georgia, serif" }}>
              {tf.flightNumber}
            </span>

            {/* Airborne pulsing indicator */}
            {data && airborne && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  background: "#4ade80",
                  borderRadius: "50%",
                  animation: "pulseGreen 1.5s ease-in-out infinite",
                  boxShadow: "0 0 6px #4ade80",
                }} />
              </span>
            )}

            {data && (
              <span style={{
                background: sColor + "25",
                color: sColor,
                border: `1px solid ${sColor}60`,
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>
                {statusEmoji(data.status)} {data.status}
              </span>
            )}
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>
            {loading ? "Loading flight data…" : data
              ? `${data.airline || "Unknown Airline"} · ${data.aircraft || "Unknown Aircraft"}`
              : error ? "Flight not found" : "–"}
          </div>
        </div>

        {/* Route summary (compact) */}
        {data?.departure && data?.arrival && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1", fontSize: 15, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
            <span style={{ color: GOLD }}>{data.departure.iata || "???"}</span>
            <span style={{ color: "#334155", fontSize: 12 }}>→</span>
            <span style={{ color: GOLD }}>{data.arrival.iata || "???"}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {data && (
            <div onClick={e => e.stopPropagation()}>
              <FollowToggle flightNumber={tf.flightNumber} />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(tf.flightNumber); }}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#64748b",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: 13,
            }}
            title="Remove"
          >✕</button>
          <div style={{
            background: "transparent",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#64748b",
            padding: "5px 10px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
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
              height: 14,
              borderRadius: 6,
              marginBottom: 10,
              width: i === 3 ? "55%" : "100%",
              background: "linear-gradient(90deg, #1e2a40 25%, #243050 50%, #1e2a40 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{
            background: "#450a0a",
            border: "1px solid #7f1d1d",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#fca5a5",
            fontSize: 14,
          }}>
            <strong>⚠️ {error}</strong>
            {serverMessage && <div style={{ marginTop: 6, color: "#f87171", fontSize: 12 }}>{serverMessage}</div>}
          </div>
        </div>
      )}

      {/* Collapsed quick bar */}
      {!loading && !error && data && !expanded && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            { label: "GATE", value: data.departure?.gate || "TBA", highlight: !!data.departure?.gate },
            { label: "TERMINAL", value: data.departure?.terminal || "TBA", highlight: false },
            { label: "DEPARTS", value: formatLocalTime(data.departure?.revised || data.departure?.scheduled), highlight: !!data.departure?.revised && depDelay > 0 },
            { label: "ARRIVES", value: formatLocalTime(data.arrival?.revised || data.arrival?.scheduled), highlight: !!data.arrival?.revised && arrDelay > 0 },
          ].map((item, i) => (
            <div key={i} style={{
              flex: "1 1 80px",
              padding: "12px 16px",
              borderRight: i < 3 ? "1px solid #1a2540" : "none",
              textAlign: "center",
            }}>
              <div style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: item.highlight ? "#fbbf24" : "#e2e8f0", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded view */}
      {!loading && !error && data && expanded && (
        <div>
          {/* 1. Flight path animation */}
          <FlightPathAnimation depIata={data.departure?.iata ?? null} arrIata={data.arrival?.iata ?? null} />

          {/* 2. Timeline progress bar */}
          <TimelineBar dep={data.departure} arr={data.arrival} />

          {/* 3. Delay impact */}
          <DelayImpactStrip arrDelay={arrDelay} />

          {/* 4+5. Departure & Arrival panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", borderTop: "1px solid #1a2540" }}>
            <AirportPanel side="DEP" info={data.departure} delay={depDelay} />
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 8px",
              color: "#334155",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>✈️</div>
              <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, #334155, transparent)" }} />
            </div>
            <AirportPanel side="ARR" info={data.arrival} delay={arrDelay} />
          </div>

          {/* 6. Weather preview */}
          <WeatherPreview dep={data.departure} arr={data.arrival} />

          {/* 7. Aircraft & Terminal */}
          <AircraftTerminalCard data={data} />

          {/* Live data */}
          {data.live && (
            <div style={{
              margin: "0 20px 16px",
              background: "#0f2744",
              border: "1px solid #1e3a5f",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}>
              <LiveStat label="ALTITUDE" value={data.live.altitude ? `${data.live.altitude.toLocaleString()} ft` : "–"} />
              <LiveStat label="SPEED" value={data.live.speed ? `${Math.round(data.live.speed)} km/h` : "–"} />
              <LiveStat label="POSITION" value={data.live.lat && data.live.lon ? `${data.live.lat.toFixed(2)}, ${data.live.lon.toFixed(2)}` : "–"} />
              <LiveStat label="STATUS" value={data.live.isGround ? "On Ground" : "Airborne"} />
            </div>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <div style={{ padding: "0 20px 16px", textAlign: "right" }}>
              <span style={{ color: "#334155", fontSize: 11 }}>
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recently Tracked Pills ───────────────────────────────────────────────────

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
      <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: 0.5 }}>RECENT:</span>
      {recents.map(fn => (
        <button
          key={fn}
          onClick={() => onAdd(fn)}
          style={{
            background: `${GOLD}15`,
            border: `1px solid ${GOLD}40`,
            borderRadius: 20,
            color: GOLD,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "monospace",
            letterSpacing: 0.5,
          }}
        >{fn}</button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlightManager() {
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved flights
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const flightNumbers: string[] = JSON.parse(saved);
        const initial: TrackedFlight[] = flightNumbers.map((fn) => ({
          flightNumber: fn,
          data: null,
          loading: true,
          error: null,
          serverMessage: null,
          lastUpdated: null,
          expanded: false,
        }));
        setTrackedFlights(initial);
        initial.forEach((tf) => fetchFlight(tf.flightNumber));
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const numbers = trackedFlights.map((tf) => tf.flightNumber);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
  }, [trackedFlights.map((tf) => tf.flightNumber).join(",")]);

  // Auto-refresh
  useEffect(() => {
    if (trackedFlights.length === 0) return;
    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          handleRefreshAll();
          return REFRESH_INTERVAL;
        }
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
    // Save to recents
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
    const flights = trackedFlights.map((tf) => tf.flightNumber);
    await Promise.all(flights.map((fn) => fetchFlight(fn)));
    setIsRefreshing(false);
  }, [trackedFlights, isRefreshing, fetchFlight]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #030712 0%, #060d1a 40%, #0a1628 100%)",
      color: "#f1f5f9",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "0 0 80px",
      paddingTop: "72px",
    }}>

      {/* Premium Header */}
      <div style={{
        background: "linear-gradient(135deg, #050d1f 0%, #0a1530 40%, #0f1f40 70%, #05090f 100%)",
        borderBottom: `1px solid ${GOLD}30`,
        padding: "100px 24px 40px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background accent glow */}
        <div style={{
          position: "absolute",
          top: -80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: `radial-gradient(ellipse, ${GOLD}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          {/* Branding */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 13, letterSpacing: 6, color: GOLD, fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>
              ✦ CB Travel · Concierge Intelligence ✦
            </div>
            <h1 style={{
              margin: "0 0 10px",
              fontSize: 40,
              fontWeight: 800,
              fontFamily: "Georgia, 'Times New Roman', serif",
              background: `linear-gradient(135deg, #f8fafc 0%, ${GOLD} 50%, #f8fafc 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -0.5,
              lineHeight: 1.15,
            }}>
              Live Flight Intelligence
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 15, letterSpacing: 0.3 }}>
              Real-time tracking for your clients' journeys
            </p>
          </div>

          {/* Search bar */}
          <div style={{
            display: "flex",
            gap: 10,
            background: "#0a1020",
            border: `2px solid ${searchFocused ? GOLD : GOLD + "40"}`,
            borderRadius: 16,
            padding: "4px 4px 4px 16px",
            boxShadow: searchFocused
              ? `0 0 30px ${GOLD}40, 0 0 60px ${GOLD}15`
              : `0 0 20px ${GOLD}15`,
            transition: "box-shadow 0.3s, border-color 0.3s",
            animation: searchFocused ? "none" : "glowPulse 3s ease-in-out infinite",
          }}>
            <span style={{ color: GOLD, fontSize: 20, display: "flex", alignItems: "center", flexShrink: 0 }}>✈️</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFlight()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Enter flight number (e.g. BA2490, VS401, EZY8432)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f1f5f9",
                fontSize: 16,
                fontFamily: "monospace",
                letterSpacing: 0.5,
                padding: "10px 0",
              }}
            />
            <button
              onClick={() => handleAddFlight()}
              disabled={!searchInput.trim()}
              style={{
                background: searchInput.trim()
                  ? `linear-gradient(135deg, ${GOLD}, #a07830)`
                  : "#1e293b",
                border: "none",
                borderRadius: 12,
                color: searchInput.trim() ? "#0a0f1a" : "#475569",
                padding: "10px 24px",
                fontWeight: 800,
                fontSize: 14,
                cursor: searchInput.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                letterSpacing: 0.5,
              }}
            >
              Track Flight
            </button>
          </div>

          {/* Recently tracked pills */}
          <RecentPills
            current={trackedFlights.map(tf => tf.flightNumber)}
            onAdd={(fn) => handleAddFlight(fn)}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 0" }}>

        {/* Refresh bar */}
        {trackedFlights.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            padding: "10px 16px",
            background: "#0a1020",
            borderRadius: 12,
            border: "1px solid #1a2540",
          }}>
            <span style={{ color: "#475569", fontSize: 12 }}>
              <span style={{ color: GOLD, fontWeight: 700 }}>{trackedFlights.length}</span> flight{trackedFlights.length !== 1 ? "s" : ""} tracked
            </span>
            <button
              onClick={() => { setRefreshCountdown(REFRESH_INTERVAL); handleRefreshAll(); }}
              style={{
                background: "transparent",
                border: `1px solid ${GOLD}40`,
                borderRadius: 8,
                color: isRefreshing ? GOLD : "#64748b",
                padding: "5px 14px",
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
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
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#334155" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🛫</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#475569", marginBottom: 10, fontFamily: "Georgia, serif" }}>
              No flights tracked yet
            </div>
            <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
              Search for a flight number above to get live gate info,<br />
              delays, terminal assignments and real-time status.
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: "#1e3a5f" }}>
              Try: <span style={{ color: GOLD, fontFamily: "monospace" }}>BA2490</span> · <span style={{ color: GOLD, fontFamily: "monospace" }}>VS401</span> · <span style={{ color: GOLD, fontFamily: "monospace" }}>EZY8432</span>
            </div>
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

      {/* Global keyframe styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
          50% { opacity: 0.4; box-shadow: 0 0 14px #4ade80; }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 8px ${GOLD}99; transform: translate(-50%, -50%) scale(1); }
          50% { box-shadow: 0 0 20px ${GOLD}; transform: translate(-50%, -50%) scale(1.25); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes planeFly {
          0% { left: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: calc(100% - 18px); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px ${GOLD}15; }
          50% { box-shadow: 0 0 30px ${GOLD}30; }
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}
