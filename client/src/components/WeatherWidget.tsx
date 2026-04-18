import { trpc } from "../lib/trpc";

const weatherCodes: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Icy fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌧️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Heavy showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  99: { label: "Heavy thunderstorm", icon: "⛈️" },
};

export default function WeatherWidget({ destination }: { destination: string }) {
  const { data: weather, isLoading } = trpc.weather.getWeather.useQuery({ destination }, { enabled: !!destination });

  if (!destination) return null;
  if (isLoading) return (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-sky-200 rounded w-24 mb-2" />
      <div className="h-8 bg-sky-200 rounded w-16" />
    </div>
  );
  if (!weather) return null;
  const code = weather.weather_code ?? 0;
  const { label, icon } = weatherCodes[code] ?? { label: "Unknown", icon: "🌡️" };

  return (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">Current Weather — {destination}</p>
      <div className="flex items-center gap-4">
        <span className="text-5xl">{icon}</span>
        <div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{Math.round(weather.temperature_2m ?? 0)}°C</p>
          <p className="text-slate-600 text-sm">{label}</p>
          {weather.relative_humidity_2m && <p className="text-slate-500 text-xs">Humidity: {weather.relative_humidity_2m}%</p>}
          {weather.uv_index !== undefined && <p className="text-slate-500 text-xs">UV Index: {weather.uv_index}</p>}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">Via Open-Meteo (free) • Updates hourly</p>
    </div>
  );
}
