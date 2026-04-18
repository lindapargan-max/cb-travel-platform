import { useState } from "react";
import { trpc } from "../lib/trpc";

const DESTINATION_CURRENCIES: Record<string, string> = {
  "Spain": "EUR", "France": "EUR", "Italy": "EUR", "Greece": "EUR", "Portugal": "EUR",
  "Turkey": "TRY", "Egypt": "EGP", "Thailand": "THB", "Japan": "JPY", "Maldives": "MVR",
  "Dubai": "AED", "UAE": "AED", "Morocco": "MAD", "Tunisia": "TND", "Cyprus": "EUR",
  "Malta": "EUR", "Croatia": "EUR", "Bulgaria": "BGN", "USA": "USD", "Mexico": "MXN",
  "Caribbean": "USD", "Barbados": "BBD", "Jamaica": "JMD", "Cancun": "MXN",
  "Tenerife": "EUR", "Lanzarote": "EUR", "Fuerteventura": "EUR", "Majorca": "EUR",
  "Cuba": "CUP", "Sri Lanka": "LKR", "Bali": "IDR", "Indonesia": "IDR",
  "Australia": "AUD", "Canada": "CAD", "New Zealand": "NZD", "South Africa": "ZAR",
  "Kenya": "KES", "Tanzania": "TZS", "India": "INR", "Nepal": "NPR",
  "Switzerland": "CHF", "Norway": "NOK", "Sweden": "SEK", "Denmark": "DKK",
  "Vietnam": "VND", "China": "CNY", "South Korea": "KRW", "Singapore": "SGD",
  "Hong Kong": "HKD",
};

function detectCurrency(destination: string): string {
  if (!destination) return "EUR";
  const entry = Object.entries(DESTINATION_CURRENCIES).find(([key]) =>
    destination.toLowerCase().includes(key.toLowerCase())
  );
  return entry ? entry[1] : "EUR";
}

export function CurrencyConverter({ destination }: { destination?: string }) {
  const defaultTo = detectCurrency(destination || "");
  const [amount, setAmount] = useState(500);
  const [toCurrency, setToCurrency] = useState(defaultTo);
  const { data: rateData } = trpc.currency.getExchangeRate.useQuery({ from: "GBP", to: toCurrency }, { staleTime: 3600000 });

  const currencies = Array.from(new Set(Object.values(DESTINATION_CURRENCIES))).sort();
  const convertedAmount = rateData ? (amount * rateData.rate).toFixed(2) : null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">💱 Currency Converter</p>
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">GBP Amount</label>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">£</span>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={1}
              className="w-24 border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
          </div>
        </div>
        <div className="text-slate-400 pb-2 text-xl">=</div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block">To Currency</label>
          <select value={toCurrency} onChange={e => setToCurrency(e.target.value)}
            className="border border-amber-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {convertedAmount && (
          <div className="pb-1">
            <p className="text-2xl font-bold text-[#1e3a5f]">{Number(convertedAmount).toLocaleString()} {toCurrency}</p>
            <p className="text-xs text-slate-500">Rate: 1 GBP = {rateData?.rate?.toFixed(4)} {toCurrency}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">Rates via Frankfurter.app • For reference only</p>
    </div>
  );
}
