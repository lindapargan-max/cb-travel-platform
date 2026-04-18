import { useState } from "react";

interface FlightStatus {
  flight_date?: string;
  flight_status?: string;
  departure?: { airport?: string; scheduled?: string; estimated?: string; terminal?: string; gate?: string; delay?: number };
  arrival?: { airport?: string; scheduled?: string; estimated?: string; terminal?: string; gate?: string; delay?: number };
  airline?: { name?: string };
  flight?: { iata?: string };
}

function formatTime(isoStr?: string) {
  if (!isoStr) return "—";
  try { return new Date(isoStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return "—"; }
}

export default function FlightStatusTracker({ flightNumber }: { flightNumber?: string }) {
  const [flight, setFlight] = useState<FlightStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFlight, setCustomFlight] = useState(flightNumber || "");

  const lookupFlight = async (fn: string) => {
    if (!fn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://upbeat-quietude-production-dc2a.up.railway.app/api/flight-status?flight=${encodeURIComponent(fn)}`);
      if (!res.ok) throw new Error("Flight not found or API key not configured");
      const data = await res.json();
      if (data.data && data.data.length > 0) setFlight(data.data[0]);
      else setError("Flight not found. Please check the flight number.");
    } catch (e: any) {
      setError(e.message || "Unable to fetch flight status.");
    } finally { setLoading(false); }
  };

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    landed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700",
    diverted: "bg-orange-100 text-orange-700",
    incident: "bg-red-200 text-red-800",
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">✈️ Flight Status</p>
      <div className="flex gap-2 mb-3">
        <input value={customFlight} onChange={e => setCustomFlight(e.target.value.toUpperCase())} placeholder="e.g. BA2490"
          className="border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase" />
        <button onClick={() => lookupFlight(customFlight)} disabled={loading || !customFlight}
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d5986] transition-colors disabled:opacity-50">
          {loading ? "..." : "Check"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {flight && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-[#1e3a5f]">{flight.flight?.iata}</span>
            {flight.airline?.name && <span className="text-slate-500 text-sm">{flight.airline.name}</span>}
            {flight.flight_status && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[flight.flight_status] || 'bg-slate-100 text-slate-600'}`}>{flight.flight_status.toUpperCase()}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-slate-500 mb-1">Departure</p>
              <p className="font-semibold text-sm">{flight.departure?.airport}</p>
              <p className="text-xs text-slate-600">Scheduled: {formatTime(flight.departure?.scheduled)}</p>
              {flight.departure?.estimated !== flight.departure?.scheduled && <p className="text-xs text-amber-600">Estimated: {formatTime(flight.departure?.estimated)}</p>}
              {flight.departure?.terminal && <p className="text-xs text-slate-500">Terminal {flight.departure.terminal}{flight.departure.gate ? ` · Gate ${flight.departure.gate}` : ""}</p>}
              {(flight.departure?.delay ?? 0) > 0 && <p className="text-xs text-red-600">⚠️ Delayed {flight.departure?.delay}min</p>}
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-slate-500 mb-1">Arrival</p>
              <p className="font-semibold text-sm">{flight.arrival?.airport}</p>
              <p className="text-xs text-slate-600">Scheduled: {formatTime(flight.arrival?.scheduled)}</p>
              {flight.arrival?.estimated !== flight.arrival?.scheduled && <p className="text-xs text-amber-600">Estimated: {formatTime(flight.arrival?.estimated)}</p>}
              {flight.arrival?.terminal && <p className="text-xs text-slate-500">Terminal {flight.arrival.terminal}{flight.arrival.gate ? ` · Gate ${flight.arrival.gate}` : ""}</p>}
            </div>
          </div>
        </div>
      )}
      {!flight && !error && !loading && <p className="text-slate-500 text-xs">Enter a flight number to check real-time status.</p>}
    </div>
  );
}
