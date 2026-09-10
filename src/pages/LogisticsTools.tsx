import { useState, useMemo } from "react";
import { Calculator, Box, Truck, Package, Globe, Ruler, Leaf, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import GeoChallenge from "@/components/GeoChallenge";
import DispatchSim from "@/components/DispatchSim";
import LdmCalc from "@/components/LdmCalc";
import Co2Calc from "@/components/Co2Calc";
import AdrRef from "@/components/AdrRef";

type ToolTab = "pallet" | "volume" | "costsim" | "geography" | "dispatch" | "ldm" | "co2" | "adr";

// ─── Pallet Loading Calculator ────────────────────────────────────────────
const TRUCK_TYPES = [
  { key: "van", label_en: "Delivery Van (3.5t)", label_fr: "Camionnette (3,5t)", lengthM: 2.8, widthM: 1.75, maxWeightKg: 900, maxPallets: 4 },
  { key: "truck75", label_en: "Light Truck (7.5t)", label_fr: "Porteur léger (7,5t)", lengthM: 4.2, widthM: 2.1, maxWeightKg: 4500, maxPallets: 8 },
  { key: "truck20", label_en: "Freight Truck (20t)", label_fr: "Camion de fret (20t)", lengthM: 7.6, widthM: 2.4, maxWeightKg: 12000, maxPallets: 16 },
  { key: "trailer", label_en: "European Trailer (24t)", label_fr: "Semi-remorque (24t)", lengthM: 13.6, widthM: 2.4, maxWeightKg: 24000, maxPallets: 33 },
];

const PALLET_TYPES = [
  { key: "eur", label: "EUR (120×80 cm)", lM: 1.2, wM: 0.8 },
  { key: "uk", label: "UK (120×100 cm)", lM: 1.2, wM: 1.0 },
  { key: "half", label_en: "Half EUR (80×60 cm)", label_fr: "Demi EUR (80×60 cm)", lM: 0.8, wM: 0.6 },
];

function PalletTool({ L }: { L: (en: string, fr: string, ar?: string) => string }) {
  const [truckKey, setTruckKey] = useState("trailer");
  const [palletKey, setPalletKey] = useState("eur");
  const [palletCount, setPalletCount] = useState("20");
  const [weightPerPallet, setWeightPerPallet] = useState("500");

  const truck = TRUCK_TYPES.find(t => t.key === truckKey)!;
  const pallet = PALLET_TYPES.find(p => p.key === palletKey)!;

  const result = useMemo(() => {
    const perRow = Math.floor(truck.widthM / pallet.wM);
    const rows = Math.floor(truck.lengthM / pallet.lM);
    const maxBySpace = perRow * rows;
    const reqCount = parseInt(palletCount) || 0;
    const totalWeight = reqCount * (parseFloat(weightPerPallet) || 0);
    const fitsSpace = reqCount <= maxBySpace;
    const fitsWeight = totalWeight <= truck.maxWeightKg;
    const fits = fitsSpace && fitsWeight;
    const spaceUsedPct = Math.min(100, Math.round((reqCount / maxBySpace) * 100));
    const weightPct = Math.min(100, Math.round((totalWeight / truck.maxWeightKg) * 100));
    return { maxBySpace, perRow, rows, reqCount, totalWeight, fitsSpace, fitsWeight, fits, spaceUsedPct, weightPct };
  }, [truck, pallet, palletCount, weightPerPallet]);

  // Visual grid (max 33 cells)
  const cellCount = Math.min(result.maxBySpace, 33);
  const filled = Math.min(result.reqCount, cellCount);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Truck type", "Type de camion")}</label>
          <select value={truckKey} onChange={e => setTruckKey(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition">
            {TRUCK_TYPES.map(t => <option key={t.key} value={t.key}>{L(t.label_en, t.label_fr)}</option>)}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{L("Bed", "Plateau")} : {truck.lengthM}m × {truck.widthM}m · max {truck.maxWeightKg.toLocaleString()} kg</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Pallet type", "Type de palette")}</label>
          <select value={palletKey} onChange={e => setPalletKey(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition">
            {PALLET_TYPES.map(p => <option key={p.key} value={p.key}>{p.label || L((p as any).label_en, (p as any).label_fr)}</option>)}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{pallet.lM * 100}×{pallet.wM * 100} cm</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Number of pallets", "Nombre de palettes")}</label>
          <input type="number" min={1} max={100} value={palletCount} onChange={e => setPalletCount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Weight per pallet (kg)", "Poids par palette (kg)")}</label>
          <input type="number" min={1} value={weightPerPallet} onChange={e => setWeightPerPallet(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
        </div>
      </div>

      {/* Results */}
      <div className={`rounded-xl border-2 p-5 ${result.fits ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20" : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">
            {result.fits
              ? <CheckCircle2 className="w-7 h-7 text-green-600" />
              : <AlertTriangle className="w-7 h-7 text-red-600" />}
          </span>
          <p className={`font-bold ${result.fits ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
            {result.fits
              ? L("Your load fits in this vehicle!", "Votre chargement rentre dans ce véhicule !")
               : `${!result.fitsSpace ? L("Too many pallets for this truck's space!", "Trop de palettes pour l'espace de ce camion !") : ""} ${!result.fitsWeight ? L("Weight exceeds truck limit!", "Le poids dépasse la limite du camion !") : ""}`}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center"><p className="text-2xl font-black text-[#1a2e4a] dark:text-blue-300">{result.maxBySpace}</p><p className="text-xs text-slate-500 dark:text-slate-400">{L("Max pallets (space)", "Max palettes (espace)")}</p></div>
          <div className="text-center"><p className="text-2xl font-black text-[#1a2e4a] dark:text-blue-300">{result.reqCount}</p><p className="text-xs text-slate-500 dark:text-slate-400">{L("Pallets requested", "Palettes demandées")}</p></div>
          <div className="text-center"><p className="text-2xl font-black text-[#1a2e4a] dark:text-blue-300">{result.spaceUsedPct}%</p><p className="text-xs text-slate-500 dark:text-slate-400">{L("Space used", "Espace utilisé")}</p></div>
          <div className="text-center"><p className="text-2xl font-black text-[#1a2e4a] dark:text-blue-300">{result.totalWeight.toLocaleString()}</p><p className="text-xs text-slate-500 dark:text-slate-400">kg {L("total", "total")}</p></div>
        </div>
        {/* Space bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1"><span>{L("Space", "Espace")}</span><span>{result.spaceUsedPct}% / 100%</span></div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all ${result.spaceUsedPct > 100 ? "bg-red-500" : result.spaceUsedPct > 85 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(result.spaceUsedPct, 100)}%` }} />
          </div>
        </div>
        {/* Weight bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1"><span>{L("Weight", "Poids")}</span><span>{result.weightPct}% / 100%</span></div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all ${result.weightPct > 100 ? "bg-red-500" : result.weightPct > 85 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(result.weightPct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Visual pallet map */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
          <span className="inline-flex items-center gap-2"><Truck className="w-4 h-4 text-[#C94C4C]" />{L("Truck bed — top view (simplified)", "Plateau camion — vue de dessus (simplifié)")}</span>
        </h4>
        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 border-2 border-slate-300 dark:border-slate-600" style={{ overflowX: "auto" }}>
          <div className="flex flex-wrap gap-1.5" style={{ maxWidth: `${result.perRow * 38}px` }}>
            {Array.from({ length: cellCount }, (_, i) => (
              <div key={i} title={`Palette ${i + 1}`}
                className={`rounded border text-center flex items-center justify-center text-xs font-bold transition-colors ${
                  i < filled
                    ? "bg-[#1a2e4a] dark:bg-blue-700 border-[#1a2e4a] dark:border-blue-600 text-white"
                    : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600"
                }`}
                style={{ width: "34px", height: "34px", fontSize: "9px" }}>
                 {i < filled ? <Package className="w-4 h-4 text-[#D9B75F]" /> : ""}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1a2e4a] dark:bg-blue-700 rounded inline-block" />{L("Loaded", "Chargé")} ({filled})</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded inline-block" />{L("Empty", "Vide")} ({Math.max(0, cellCount - filled)})</span>
        </div>
      </div>
    </div>
  );
}

// ─── Volume Calculator ─────────────────────────────────────────────────────
function VolumeTool({ L }: { L: (en: string, fr: string, ar?: string) => string }) {
  const [unit, setUnit] = useState<"cm" | "m">("cm");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [pallets, setPallets] = useState("");
  const [mode, setMode] = useState<"single" | "pallet">("single");

  const result = useMemo(() => {
    if (mode === "single") {
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      const factor = unit === "cm" ? 0.000001 : 1;
      const vol = l * w * h * factor;
      const ldm = unit === "cm" ? (l / 100 * w / 100) / 2.4 : (l * w) / 2.4;
      return { vol, ldm };
    } else {
      // EUR pallet: 120×80×(height)cm, qty
      const h = parseFloat(height) || 0;
      const qty = parseInt(pallets) || 1;
      const hM = unit === "cm" ? h / 100 : h;
      const vol = 1.2 * 0.8 * hM * qty;
      const ldm = (1.2 * 0.8 * qty) / 2.4;
      return { vol, ldm };
    }
  }, [length, width, height, pallets, unit, mode]);

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(["single", "pallet"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${mode === m ? "bg-[#1a2e4a] dark:bg-blue-700 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`}>
              <span className="inline-flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {m === "single" ? L("Single item", "Article unique") : L("By pallets", "Par palettes")}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(["cm", "m"] as const).map(u => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${unit === u ? "bg-slate-700 dark:bg-slate-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`}>
              {u}
            </button>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Length", "Longueur")} ({unit})</label><input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="120" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Width", "Largeur")} ({unit})</label><input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="80" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Height", "Hauteur")} ({unit})</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="150" className={inputCls} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Height per pallet", "Hauteur par palette")} ({unit})</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder={unit === "cm" ? "150" : "1.5"} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Number of pallets", "Nombre de palettes")}</label><input type="number" value={pallets} onChange={e => setPallets(e.target.value)} placeholder="6" className={inputCls} /></div>
        </div>
      )}

      {result.vol > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div className="text-center">
              <p className="text-3xl font-black text-[#1a2e4a] dark:text-blue-300">{result.vol.toFixed(3)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">m³</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-[#1a2e4a] dark:text-blue-300">{result.ldm.toFixed(2)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">ldm ({L("loading metres", "mètres linéaires")})</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-[#1a2e4a] dark:text-blue-300">{Math.round(result.vol * 1000)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">litres</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
            {L("Loading metres = floor area / 2.4m (standard trailer width)", "Mètres linéaires = surface au sol / 2,4m (largeur remorque standard)")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Cost Simulator ────────────────────────────────────────────────────────
function CostSimTool({ L }: { L: (en: string, fr: string, ar?: string) => string }) {
  const [distKm, setDistKm] = useState("");
  const [pallets, setPallets] = useState("");
  const [fuelPrice, setFuelPrice] = useState("1.65");
  const [vehicleKey, setVehicleKey] = useState("truck20");

  const vehicle = TRUCK_TYPES.find(t => t.key === vehicleKey)!;

  const FUEL_CONSUMPTION: Record<string, number> = { van: 9, truck75: 18, truck20: 28, trailer: 36 };
  const TOLL_RATE: Record<string, number> = { van: 0.05, truck75: 0.12, truck20: 0.18, trailer: 0.22 };

  const result = useMemo(() => {
    const km = parseFloat(distKm) || 0;
    const pal = parseInt(pallets) || 0;
    const fuel = parseFloat(fuelPrice) || 0;
    const fuelConsL100 = FUEL_CONSUMPTION[vehicleKey];
    const fuelCost = +(km * fuelConsL100 / 100 * fuel).toFixed(2);
    const tollCost = +(km * TOLL_RATE[vehicleKey]).toFixed(2);
    const palletSurcharge = +(pal * 5).toFixed(2);
    const baseCost = +(km * 1.2).toFixed(2);
    const driverCost = +(km / 80 * 15).toFixed(2); // ~80km/h avg, 15€/h
    const total = +(fuelCost + tollCost + palletSurcharge + driverCost).toFixed(2);
    return { km, fuelCost, tollCost, palletSurcharge, driverCost, baseCost, total };
  }, [distKm, pallets, fuelPrice, vehicleKey]);

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Vehicle type", "Type de véhicule")}</label>
          <select value={vehicleKey} onChange={e => setVehicleKey(e.target.value)} className={inputCls}>
            {TRUCK_TYPES.map(t => <option key={t.key} value={t.key}>{L(t.label_en, t.label_fr)}</option>)}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {L("Fuel consumption", "Consommation")} : ~{FUEL_CONSUMPTION[vehicleKey]}L/100km
          </p>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Distance (km)", "Distance (km)")}</label><input type="number" value={distKm} onChange={e => setDistKm(e.target.value)} placeholder="500" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("EUR pallets", "Palettes EUR")}</label><input type="number" value={pallets} onChange={e => setPallets(e.target.value)} placeholder="12" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{L("Diesel price (€/L)", "Prix diesel (€/L)")}</label><input type="number" step="0.01" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="1.65" className={inputCls} /></div>
      </div>

      {result.km > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#1a2e4a] dark:border-blue-700 p-5">
          <h4 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Detailed cost breakdown", "Détail du coût")}</h4>
          <div className="space-y-2.5 text-sm">
            {[
              { label: L("Fuel cost", "Carburant"), val: result.fuelCost, sub: `${FUEL_CONSUMPTION[vehicleKey]}L/100km × ${result.km}km` },
              { label: L("Toll estimate", "Péages estimés"), val: result.tollCost, sub: `${TOLL_RATE[vehicleKey]}€/km` },
              { label: L("Driver cost", "Coût chauffeur"), val: result.driverCost, sub: `${result.km}km ÷ 80km/h × 15€/h` },
              { label: L("Pallet surcharge", "Supplément palette"), val: result.palletSurcharge, sub: `${parseInt(pallets) || 0} × 5.00€` },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-start">
                <div>
                  <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">({row.sub})</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 ml-4">{row.val.toFixed(2)} €</span>
              </div>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-black text-lg">
              <span className="text-[#1a2e4a] dark:text-blue-300">{L("Total estimate", "Total estimé")}</span>
              <span className="text-[#1a2e4a] dark:text-blue-300">{result.total.toFixed(2)} €</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            * {L("Indicative estimates only. Standard rate: 1.20€/km + 5€/pallet. Actual costs vary by route and conditions.", "Estimations indicatives uniquement. Tarif standard : 1,20€/km + 5€/palette. Les coûts réels varient selon l'itinéraire et les conditions.")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function LogisticsTools() {
  const { lang } = useApp();
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;
  const [activeTab, setActiveTab] = useState<ToolTab>("pallet");

  const tabs = [
    { id: "pallet" as ToolTab, label_en: "Pallet Calculator", label_fr: "Calcul palettes", icon: <Package className="w-4 h-4" /> },
    { id: "volume" as ToolTab, label_en: "Volume Calculator", label_fr: "Calcul de volume", icon: <Box className="w-4 h-4" /> },
    { id: "costsim" as ToolTab, label_en: "Cost Simulator", label_fr: "Simulateur de coût", icon: <Calculator className="w-4 h-4" /> },
    { id: "ldm" as ToolTab, label_en: "LDM Calculator", label_fr: "Calcul ML", icon: <Ruler className="w-4 h-4" /> },
    { id: "co2" as ToolTab, label_en: "CO₂ Emissions", label_fr: "Émissions CO₂", icon: <Leaf className="w-4 h-4" /> },
    { id: "adr" as ToolTab, label_en: "ADR Reference", label_fr: "Référence ADR", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "geography" as ToolTab, label_en: "Geo Challenge", label_fr: "Géo Challenge", icon: <Globe className="w-4 h-4" /> },
    { id: "dispatch" as ToolTab, label_en: "Dispatch Sim", label_fr: "Simulateur Dispatch", icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 bg-[#1a2e4a] dark:bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">
            {L("Logistics Tools", "Outils logistiques")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {L("Professional logistics calculators: pallet loading, volume, and transport cost simulation.", "Calculateurs logistiques professionnels : chargement palette, volume et simulation de coût de transport.")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-[#1a2e4a] dark:bg-blue-700 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}>
             {tab.icon}
            {L(tab.label_en, tab.label_fr)}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-colors${activeTab === "geography" || activeTab === "dispatch" ? " hidden" : ""}`}>
        {activeTab === "ldm" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><Ruler className="w-5 h-5 text-[#C94C4C]" />{L("Loadmetre (LDM) Calculator", "Calculateur de Mètres Linéaires (ML)")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("Calculate linear deck metres for groupage and partial loads. Standard European 13.6m trailer.", "Calculez les mètres linéaires pour les envois groupage et charges partielles. Semi-remorque européen standard 13,6m.")}
              </p>
            </div>
            <LdmCalc />
          </>
        )}
        {activeTab === "co2" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><Leaf className="w-5 h-5 text-[#2A8A62]" />{L("Carbon Footprint Calculator", "Calculateur d'empreinte carbone")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("Compare CO₂ emissions across transport modes: road, rail, sea, and air.", "Comparez les émissions CO₂ selon les modes de transport : route, fer, mer et air.")}
              </p>
            </div>
            <Co2Calc />
          </>
        )}
        {activeTab === "adr" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-[#C94C4C]" />{L("ADR Dangerous Goods Reference", "Référence marchandises dangereuses ADR")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("European ADR 2023 regulations: 9 classes, UN numbers, required documents, limited quantities.", "Réglementation européenne ADR 2023 : 9 classes, numéros ONU, documents requis, quantités limitées.")}
              </p>
            </div>
            <AdrRef />
          </>
        )}
        {activeTab === "pallet" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><Package className="w-5 h-5 text-[#D9B75F]" />{L("Pallet Loading Calculator", "Calculateur de chargement palettes")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("Check how many pallets fit in your chosen vehicle and verify weight limits.", "Vérifiez combien de palettes rentrent dans le véhicule choisi et contrôlez les limites de poids.")}
              </p>
            </div>
            <PalletTool L={L} />
          </>
        )}
        {activeTab === "volume" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><Box className="w-5 h-5 text-[#2A4A7A]" />{L("Volume & Loading Metres Calculator", "Calculateur de volume et mètres linéaires")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("Calculate the volume in m³ and loading metres (ldm) for single items or full pallet sets.", "Calculez le volume en m³ et les mètres linéaires pour un article unique ou un ensemble de palettes.")}
              </p>
            </div>
            <VolumeTool L={L} />
          </>
        )}
        {activeTab === "costsim" && (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">
                <span className="inline-flex items-center gap-2"><Calculator className="w-5 h-5 text-[#C94C4C]" />{L("Transport Cost Simulator", "Simulateur de coût de transport")}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {L("Detailed cost breakdown: fuel, tolls, driver costs and pallet surcharge.", "Détail du coût : carburant, péages, coûts chauffeur et supplément palette.")}
              </p>
            </div>
            <CostSimTool L={L} />
          </>
        )}
      </div>

      {/* Geography Challenge — full-width, outside card */}
      {activeTab === "geography" && (
        <div className="mt-0">
          <GeoChallenge />
        </div>
      )}

      {/* Dispatch Manager Simulator — full-width, outside card */}
      {activeTab === "dispatch" && (
        <div className="mt-0">
          <DispatchSim />
        </div>
      )}

      {/* Standards reference */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-colors">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">
          <span className="inline-flex items-center gap-2"><Package className="w-5 h-5 text-[#D9B75F]" />{L("European Pallet Standards Reference", "Référence standards palettes européennes")}</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{L("Type", "Type")}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{L("Dimensions (L×W cm)", "Dimensions (L×l cm)")}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{L("Max load (kg)", "Charge max (kg)")}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{L("Use", "Usage")}</th>
            </tr></thead>
            <tbody>
              {[
                { type: "EUR (EPAL 1)", dim: "120 × 80", max: "1 500", use: L("Standard EU — most common", "Standard UE — le plus courant") },
                { type: "EUR 2 (EPAL 2)", dim: "120 × 100", max: "1 500", use: L("Chemical / pharmaceutical", "Chimique / pharmaceutique") },
                { type: "EUR 6 (Half pallet)", dim: "80 × 60", max: "500", use: L("Retail / small loads", "Grande distribution / petits volumes") },
                { type: "ISO (UK pallet)", dim: "120 × 100", max: "1 000", use: L("United Kingdom transport", "Transport Royaume-Uni") },
              ].map(row => (
                <tr key={row.type} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2.5 font-semibold text-[#1a2e4a] dark:text-blue-300">{row.type}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{row.dim}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{row.max} kg</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
