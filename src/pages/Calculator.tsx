import { useState } from "react";
import { MapPin, Package, ArrowRight, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

const RATE_PER_KM = 1.2;
const RATE_PER_PALLET = 5;

interface Result {
  distance: number; pallets: number; cartons: number | null;
  distanceCost: number; palletCost: number; totalCost: number;
  pickup: string; delivery: string;
}

async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr,en" } });
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Address not found: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function getRouteDistance(from: { lat: number; lon: number }, to: { lat: number; lon: number }): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found between these addresses");
  return Math.round(data.routes[0].distance / 1000);
}

const input = "w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 dark:focus:ring-blue-500/40 transition";

export default function Calculator() {
  const { lang } = useApp();
  const tx = t[lang].calculator;

  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [pallets, setPallets] = useState("");
  const [cartons, setCartons] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canCalculate = pickup.trim() && delivery.trim() && Number(pallets) > 0;

  const handleCalculate = async () => {
    if (!canCalculate) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const [fromCoords, toCoords] = await Promise.all([geocode(pickup.trim()), geocode(delivery.trim())]);
      const distanceKm = await getRouteDistance(fromCoords, toCoords);
      const numPallets = parseInt(pallets, 10);
      const numCartons = cartons.trim() ? parseInt(cartons, 10) : null;
      const distanceCost = parseFloat((distanceKm * RATE_PER_KM).toFixed(2));
      const palletCost = numPallets * RATE_PER_PALLET;
      const totalCost = parseFloat((distanceCost + palletCost).toFixed(2));
      setResult({ distance: distanceKm, pallets: numPallets, cartons: numCartons, distanceCost, palletCost, totalCost, pickup: pickup.trim(), delivery: delivery.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setPickup(""); setDelivery(""); setPallets(""); setCartons(""); setError(null); setResult(null); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">{tx.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{tx.subtitle}</p>
      </div>

      <div className="space-y-6">
        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 transition-colors">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-5">{tx.sectionTitle}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.pickup}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input type="text" value={pickup} onChange={e => setPickup(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} placeholder={tx.pickupPh}
                  className={`${input} pl-10`} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.delivery}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input type="text" value={delivery} onChange={e => setDelivery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} placeholder={tx.deliveryPh}
                  className={`${input} pl-10`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.pallets}</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={pallets} onChange={e => setPallets(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCalculate()} min="1" placeholder={tx.palletsPh}
                    className={`${input} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {tx.cartons} <span className="text-slate-400 text-xs">({tx.optional})</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={cartons} onChange={e => setCartons(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCalculate()} min="1" placeholder={tx.cartonsPh}
                    className={`${input} pl-10`} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>📏 {RATE_PER_KM.toFixed(2)} {tx.routeNote.includes("km") ? "€/km" : "€/km"}</span>
            <span>📦 {RATE_PER_PALLET.toFixed(2)} €</span>
            <span>🗺️ {tx.routeNote}</span>
          </div>

          <button onClick={handleCalculate} disabled={!canCalculate || loading}
            className="mt-5 w-full bg-[#1a2e4a] hover:bg-[#243d62] dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{tx.btnLoading}</> : <>{tx.btn} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{tx.errorTitle}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{tx.resultTitle}</h2>
              <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 text-xs transition">
                <RotateCcw className="w-3 h-3" /> {tx.reset}
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="truncate font-medium">{result.pickup}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="truncate font-medium">{result.delivery}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">{tx.distLabel}</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{result.distance}</p>
                <p className="text-xs text-blue-400">km</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mb-1">{tx.palletsLabel}</p>
                <p className="text-2xl font-black text-slate-700 dark:text-slate-100">{result.pallets}</p>
                <p className="text-xs text-slate-400">{result.cartons != null ? `× ${result.cartons} ctns` : "EUR"}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">{tx.totalLabel}</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{result.totalCost.toFixed(2)}</p>
                <p className="text-xs text-green-400">€</p>
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{tx.breakdown}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{tx.distLabel} ({result.distance} km × {RATE_PER_KM} €/km)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{result.distanceCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{tx.palletsLabel} ({result.pallets} × {RATE_PER_PALLET} €)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{result.palletCost.toFixed(2)} €</span>
              </div>
              {result.cartons != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Cartons ({result.pallets} × {result.cartons})</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{result.pallets * result.cartons}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[#1a2e4a] dark:text-blue-300">{tx.totalEstimate}</span>
                <span className="text-green-700 dark:text-green-400 text-base">{result.totalCost.toFixed(2)} €</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">{tx.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
