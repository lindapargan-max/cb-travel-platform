import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Cloud, Droplets, Sun, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";

interface WeatherPackingAssistantProps {
  destination: string;
  departureDate?: string;
}

// WMO Weather codes mapping
const weatherCodeMap: Record<number, { icon: string; description: string; packingTips: string[] }> = {
  0: { icon: "☀️", description: "Clear sky", packingTips: ["Sunscreen (SPF 50+)", "Sunglasses", "Hat or cap", "Light, breathable clothing"] },
  1: { icon: "🌤️", description: "Mainly clear", packingTips: ["Sunscreen", "Sunglasses", "Light jacket for evening"] },
  2: { icon: "⛅", description: "Partly cloudy", packingTips: ["Light jacket", "Sunscreen", "Sunglasses"] },
  3: { icon: "☁️", description: "Overcast", packingTips: ["Light sweater", "Long sleeves"] },
  45: { icon: "🌫️", description: "Foggy", packingTips: ["Warm layers", "Visibility gear if hiking"] },
  48: { icon: "🌫️", description: "Depositing rime fog", packingTips: ["Warm layers", "Waterproof jacket"] },
  51: { icon: "🌧️", description: "Light drizzle", packingTips: ["Compact umbrella", "Light rain jacket", "Water-resistant bag"] },
  53: { icon: "🌧️", description: "Moderate drizzle", packingTips: ["Umbrella", "Rain jacket", "Waterproof shoes"] },
  55: { icon: "🌧️", description: "Dense drizzle", packingTips: ["Sturdy umbrella", "Waterproof jacket", "Waterproof bag"] },
  61: { icon: "🌧️", description: "Slight rain", packingTips: ["Umbrella", "Rain jacket", "Water-resistant shoes"] },
  63: { icon: "🌧️", description: "Moderate rain", packingTips: ["Sturdy umbrella", "Waterproof jacket", "Waterproof bag", "Extra socks"] },
  65: { icon: "⛈️", description: "Heavy rain", packingTips: ["Strong umbrella", "Waterproof jacket", "Waterproof bag", "Waterproof shoes", "Extra clothes"] },
  71: { icon: "❄️", description: "Slight snow", packingTips: ["Winter coat", "Warm layers", "Gloves", "Warm hat", "Thermal underwear"] },
  73: { icon: "❄️", description: "Moderate snow", packingTips: ["Heavy winter coat", "Thermal layers", "Gloves", "Warm hat", "Scarf", "Warm boots"] },
  75: { icon: "❄️", description: "Heavy snow", packingTips: ["Heavy winter coat", "Multiple thermal layers", "Gloves", "Warm hat", "Scarf", "Insulated boots"] },
  80: { icon: "🌧️", description: "Slight rain showers", packingTips: ["Umbrella", "Rain jacket", "Water-resistant shoes"] },
  81: { icon: "⛈️", description: "Moderate rain showers", packingTips: ["Umbrella", "Waterproof jacket", "Waterproof bag"] },
  82: { icon: "⛈️", description: "Violent rain showers", packingTips: ["Strong umbrella", "Waterproof jacket", "Waterproof bag", "Stay indoors if possible"] },
  85: { icon: "❄️", description: "Slight snow showers", packingTips: ["Winter coat", "Warm layers", "Gloves", "Warm hat"] },
  86: { icon: "❄️", description: "Heavy snow showers", packingTips: ["Heavy winter coat", "Thermal layers", "Gloves", "Warm hat", "Scarf"] },
  95: { icon: "⛈️", description: "Thunderstorm", packingTips: ["Waterproof jacket", "Umbrella", "Stay indoors", "Avoid outdoor activities"] },
  96: { icon: "⛈️", description: "Thunderstorm with hail", packingTips: ["Waterproof jacket", "Umbrella", "Stay indoors", "Avoid outdoor activities"] },
  99: { icon: "⛈️", description: "Thunderstorm with hail", packingTips: ["Waterproof jacket", "Umbrella", "Stay indoors", "Avoid outdoor activities"] },
};

export function WeatherPackingAssistant({ destination, departureDate }: WeatherPackingAssistantProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [daysUntilTrip, setDaysUntilTrip] = useState<number | null>(null);

  const { data: weather, isLoading } = trpc.weather.getWeather.useQuery(
    { destination },
    { refetchInterval: 30 * 60 * 1000 } // Refetch every 30 minutes
  );

  useEffect(() => {
    if (weather) {
      setWeatherData(weather);
    }
  }, [weather]);

  useEffect(() => {
    if (departureDate) {
      const today = new Date();
      const departure = new Date(departureDate);
      const diff = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysUntilTrip(diff);
    }
  }, [departureDate]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cloud size={18} className="text-amber-600 animate-spin" />
          <h3 className="font-semibold text-foreground">Loading weather...</h3>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-600" />
          <h3 className="font-semibold text-foreground">Weather unavailable</h3>
        </div>
        <p className="text-sm text-muted-foreground">We couldn't fetch weather data for {destination}. Please try again later.</p>
      </div>
    );
  }

  const weatherCode = weatherData.weather_code || 0;
  const weatherInfo = weatherCodeMap[weatherCode] || weatherCodeMap[0];
  const temp = weatherData.temperature_2m || "N/A";
  const humidity = weatherData.relative_humidity_2m || "N/A";
  const uvIndex = weatherData.uv_index || 0;
  const isUrgent = daysUntilTrip !== null && daysUntilTrip <= 7;

  // Generate smart packing message
  let packingMessage = "";
  if (temp < 0) {
    packingMessage = "❄️ It's freezing! Pack heavy winter gear.";
  } else if (temp < 10) {
    packingMessage = "🧥 It's cold. Bring warm layers and a jacket.";
  } else if (temp < 15) {
    packingMessage = "🧥 It's cool. A light jacket would be good.";
  } else if (temp < 20) {
    packingMessage = "👕 It's mild. Light layers will work.";
  } else if (temp < 25) {
    packingMessage = "👕 It's warm. Light, breathable clothing recommended.";
  } else if (temp < 30) {
    packingMessage = "☀️ It's hot! Pack light clothes and stay hydrated.";
  } else {
    packingMessage = "🔥 It's very hot! Sunscreen, hat, and light clothes essential.";
  }

  if (uvIndex > 8) {
    packingMessage += " ⚠️ High UV index - sunscreen is critical!";
  }

  if (humidity > 70) {
    packingMessage += " 💧 High humidity - pack moisture-wicking clothes.";
  }

  return (
    <div className={`rounded-2xl border p-5 ${isUrgent ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{weatherInfo.icon}</span>
        <div>
          <h3 className="font-semibold text-foreground">Weather & Packing Assistant</h3>
          <p className="text-xs text-muted-foreground">{destination}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Weather */}
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <p className="text-xs font-medium text-muted-foreground mb-3">Current Conditions</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="font-bold text-lg text-primary">{temp}°C</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="font-bold text-lg text-primary">{humidity}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Conditions</p>
              <p className="font-semibold text-foreground">{weatherInfo.description}</p>
            </div>
            {uvIndex > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">UV Index</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full flex-1" style={{ width: `${Math.min(uvIndex * 10, 100)}%` }} />
                  <span className={`text-xs font-bold ${uvIndex > 8 ? 'text-red-600' : uvIndex > 5 ? 'text-orange-600' : 'text-green-600'}`}>{uvIndex.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Smart Packing Advice */}
        <div className={`rounded-lg p-3 border ${isUrgent ? 'bg-red-100 border-red-300' : 'bg-amber-100 border-amber-300'}`}>
          <div className="flex gap-2">
            <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isUrgent ? 'text-red-700' : 'text-amber-700'}`} />
            <p className={`text-sm font-medium ${isUrgent ? 'text-red-900' : 'text-amber-900'}`}>{packingMessage}</p>
          </div>
        </div>

        {/* Packing Checklist */}
        <div className="bg-white rounded-lg p-3 border border-amber-100">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Recommended Packing Items</p>
          <div className="space-y-1">
            {weatherInfo.packingTips.map((tip, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Days Until Trip */}
        {daysUntilTrip !== null && (
          <div className={`rounded-lg p-3 text-xs font-medium ${daysUntilTrip <= 7 ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
            {daysUntilTrip <= 0 ? (
              "🎉 Your trip starts today! Have a great time!"
            ) : daysUntilTrip === 1 ? (
              "✈️ Your trip is tomorrow! Final packing check!"
            ) : (
              `📅 ${daysUntilTrip} days until your trip - time to start packing!`
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">Weather data updates every 30 minutes. Always check local forecasts before traveling.</p>
      </div>
    </div>
  );
}
