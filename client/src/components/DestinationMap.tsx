import { useState } from "react";
import { trpc } from "../lib/trpc";

// Simple world map using SVG circles at approximate lat/lon mapped to viewport
// Converts lat/lon to percentage position on a simple world map SVG
function latLonToPercent(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

// Approximate lat/lon for popular destinations
const DESTINATION_COORDS: Record<string, [number, number]> = {
  "Spain": [40.4, -3.7], "Tenerife": [28.3, -16.5], "Lanzarote": [29.0, -13.6], "Fuerteventura": [28.4, -13.9],
  "Majorca": [39.7, 2.9], "France": [46.2, 2.2], "Italy": [41.9, 12.5], "Greece": [39.1, 21.8],
  "Turkey": [38.9, 35.2], "Egypt": [26.8, 30.8], "Morocco": [31.8, -7.1], "Tunisia": [33.9, 9.5],
  "Maldives": [4.2, 73.2], "Dubai": [25.2, 55.3], "UAE": [23.4, 53.8], "Thailand": [15.9, 100.9],
  "Japan": [36.2, 138.3], "Bali": [-8.3, 115.1], "Indonesia": [-0.8, 113.9], "Australia": [-25.3, 133.8],
  "USA": [37.1, -95.7], "Caribbean": [17.1, -61.8], "Jamaica": [18.1, -77.3], "Mexico": [23.6, -102.6],
  "Portugal": [39.4, -8.2], "Cyprus": [35.1, 33.4], "Malta": [35.9, 14.4], "Croatia": [45.1, 15.2],
  "Bulgaria": [42.7, 25.5], "South Africa": [-30.6, 22.9], "Kenya": [-0.0, 37.9], "Sri Lanka": [7.9, 80.8],
  "Vietnam": [14.1, 108.3], "Singapore": [1.4, 103.8], "Barbados": [13.2, -59.5], "Cuba": [21.5, -79.5],
};

export default function DestinationMap() {
  const { data: destinations } = trpc.destinations.getActive.useQuery();
  const [hovered, setHovered] = useState<any>(null);

  const pins = (destinations || []).map((d: any) => {
    const coords = DESTINATION_COORDS[d.name] || DESTINATION_COORDS[d.name?.split(',')[0]?.trim()];
    if (!coords) return null;
    const pos = latLonToPercent(coords[0], coords[1]);
    return { ...d, x: pos.x, y: pos.y };
  }).filter(Boolean);

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-3">🗺️ Destinations We Love</h2>
          <p className="text-slate-600">Our clients have explored these amazing destinations — hover to find out more</p>
        </div>
        <div className="relative bg-[#1e3a5f] rounded-2xl overflow-hidden shadow-xl" style={{ paddingTop: '50%' }}>
          {/* Simple world map SVG background */}
          <div className="absolute inset-0">
            <svg viewBox="0 0 1000 500" className="w-full h-full opacity-10 fill-white">
              {/* Very simplified continent shapes */}
              <ellipse cx="200" cy="200" rx="150" ry="130" /> {/* Americas */}
              <ellipse cx="530" cy="200" rx="130" ry="110" /> {/* Europe/Africa */}
              <ellipse cx="750" cy="180" rx="150" ry="120" /> {/* Asia */}
              <ellipse cx="820" cy="330" rx="70" ry="80" /> {/* Australia */}
            </svg>
          </div>
          {/* Destination pins */}
          {pins.map((pin: any) => (
            <div key={pin.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onMouseEnter={() => setHovered(pin)} onMouseLeave={() => setHovered(null)}>
              <div className="relative">
                <div className="w-4 h-4 bg-[#e8b84b] rounded-full border-2 border-white shadow-lg animate-pulse hover:scale-150 transition-transform" />
                {hovered?.id === pin.id && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#1e3a5f] rounded-xl shadow-xl px-3 py-2 text-xs whitespace-nowrap z-20 border border-slate-200">
                    <p className="font-bold">{pin.name}</p>
                    {pin.lastBooked && <p className="text-slate-500">Last booked: {new Date(pin.lastBooked).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>}
                    {pin.tripCount > 0 && <p className="text-slate-500">{pin.tripCount} trips</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="absolute bottom-4 left-4 text-white/70 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#e8b84b] rounded-full" /><span>Destinations visited</span></div>
          </div>
        </div>
        {destinations && destinations.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {(destinations as any[]).map((d: any) => (
              <span key={d.id} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full shadow-sm">📍 {d.name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
