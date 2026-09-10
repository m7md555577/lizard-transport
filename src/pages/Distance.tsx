import { useState } from "react";
import { MapPin, ArrowRight, Loader2, AlertCircle, Navigation } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

async function geocode(address: string): Promise<{ lat: number; lon: number; display: string }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr,en" } });
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Address not found: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}

async function getRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found between these addresses");
  return { distanceKm: Math.round(data.routes[0].distance / 1000), durationMin: Math.round(data.routes[0].duration / 60) };
}

interface Result { distanceKm: number; durationMin: number; fromDisplay: string; toDisplay: string; fromInput: string; toInput: string }

const input = "w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 dark:focus:ring-blue-500/40 transition";

export default function Distance() {
  const { lang } = useApp();
  const tx = t[lang].distance;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canCalc = from.trim() && to.trim();

  const handleCalculate = async () => {
    if (!canCalc) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const [fromCoords, toCoords] = await Promise.all([geocode(from.trim()), geocode(to.trim())]);
      const route = await getRoute(fromCoords, toCoords);
      setResult({ ...route, fromDisplay: fromCoords.display, toDisplay: toCoords.display, fromInput: from.trim(), toInput: to.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const hours = result ? Math.floor(result.durationMin / 60) : 0;
  const mins = result ? result.durationMin % 60 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">{tx.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{tx.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 transition-colors">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.from}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input type="text" value={from} onChange={e => setFrom(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} placeholder={tx.fromPh} className={input} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.to}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input type="text" value={to} onChange={e => setTo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} placeholder={tx.toPh} className={input} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">{tx.apiNote}</p>
          <button onClick={handleCalculate} disabled={!canCalc || loading}
            className="mt-5 w-full bg-[#1a2e4a] hover:bg-[#243d62] dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{tx.btnLoading}</> : <><Navigation className="w-4 h-4" />{tx.btn}</>}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 transition-colors">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">{tx.resultTitle}</h2>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="truncate font-medium">{result.fromInput}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="truncate font-medium">{result.toInput}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-6 text-center">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2">{tx.roadDist}</p>
                <p className="text-4xl font-black text-blue-700 dark:text-blue-300">{result.distanceKm}</p>
                <p className="text-sm text-blue-400 mt-1">{tx.km}</p>
              </div>
              <div className="bg-[#1a2e4a]/5 dark:bg-slate-700/50 border border-[#1a2e4a]/10 dark:border-slate-600 rounded-xl p-6 text-center">
                <p className="text-xs text-[#1a2e4a] dark:text-blue-400 font-semibold uppercase tracking-wide mb-2">{tx.travelTime}</p>
                <p className="text-4xl font-black text-[#1a2e4a] dark:text-blue-300">
                  {hours > 0 ? `${hours}h${mins.toString().padStart(2, "0")}` : `${mins}min`}
                </p>
                <p className="text-sm text-slate-400 mt-1">{tx.estimatedDriving}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{tx.resolvedTitle}</p>
              <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /><span>{result.fromDisplay}</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /><span>{result.toDisplay}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
