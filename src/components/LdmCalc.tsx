import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowRight, Info } from "lucide-react";

const PALLET_TYPES = [
  { key: "eur",   label: "EUR / EPAL (120×80 cm)",  lM: 1.2, wM: 0.8, weightKg: 25 },
  { key: "uk",    label: "UK (120×100 cm)",          lM: 1.2, wM: 1.0, weightKg: 30 },
  { key: "half",  label: "Demi-EUR (80×60 cm)",      lM: 0.8, wM: 0.6, weightKg: 13 },
  { key: "eur2",  label: "EUR 2 (120×100 cm)",       lM: 1.2, wM: 1.0, weightKg: 30 },
  { key: "us",    label: "US (120×100 cm)",          lM: 1.2, wM: 1.0, weightKg: 28 },
  { key: "custom",label: "Personnalisé",             lM: 1.2, wM: 0.8, weightKg: 25 },
];

const TRAILER_W = 2.4; // standard trailer width
const TRAILER_L = 13.6;
const TRAILER_H = 2.7;
const TRAILER_MAX_KG = 24000;

export default function LdmCalc() {
  const { lang } = useApp();
  const L = (en: string, fr: string) => lang === "fr" ? fr : en;

  const [palletKey, setPalletKey] = useState("eur");
  const [pallets, setPallets] = useState("16");
  const [layers, setLayers] = useState("1");
  const [height, setHeight] = useState("1.45");
  const [cargoWeightPerPallet, setCargoWeightPerPallet] = useState("500");
  const [customL, setCustomL] = useState("1.2");
  const [customW, setCustomW] = useState("0.8");

  const palletType = PALLET_TYPES.find(p => p.key === palletKey)!;
  const pL = palletKey === "custom" ? parseFloat(customL) || 1.2 : palletType.lM;
  const pW = palletKey === "custom" ? parseFloat(customW) || 0.8 : palletType.wM;

  const result = useMemo(() => {
    const n = parseInt(pallets) || 0;
    const ly = parseInt(layers) || 1;
    const palH = parseFloat(height) || 1.45;
    const wPerPallet = parseFloat(cargoWeightPerPallet) || 0;

    // Pallets per row (across trailer width)
    const perRow = Math.floor(TRAILER_W / pW);

    // LDM per pallet = pallet length / pallets per row
    const ldmPerPallet = pL / perRow;

    // Total LDM
    const ldmTotal = n * ldmPerPallet;

    // Volume
    const volPerPallet = pL * pW * (palH * ly);
    const volTotal = n * volPerPallet;

    // Weight
    const emptyPalletKg = palletType.weightKg * n;
    const cargoKg = wPerPallet * n;
    const totalKg = emptyPalletKg + cargoKg;

    // Max pallets in trailer
    const maxPallets = Math.floor(TRAILER_L / pL) * perRow;
    const maxLdm = TRAILER_L;
    const maxVol = TRAILER_L * TRAILER_W * TRAILER_H;

    // Percentages
    const ldmPct = Math.min(100, Math.round((ldmTotal / maxLdm) * 100));
    const weightPct = Math.min(100, Math.round((totalKg / TRAILER_MAX_KG) * 100));
    const volPct = Math.min(100, Math.round((volTotal / maxVol) * 100));

    const fits = ldmTotal <= maxLdm && totalKg <= TRAILER_MAX_KG;

    // Freight class (LDM-based pricing indicator)
    let freightClass = "";
    if (ldmTotal <= 3) freightClass = L("Groupage / LTL (≤3 LDM)", "Groupage / LTL (≤3 LDM)");
    else if (ldmTotal <= 7) freightClass = L("Partial load (3–7 LDM)", "Demi-charge (3–7 LDM)");
    else if (ldmTotal <= 13.6) freightClass = L("Full truck (FTL)", "Camion complet (FTL)");
    else freightClass = L("Multi-truck required", "Plusieurs camions requis");

    return { n, ldmTotal, ldmPerPallet, perRow, volTotal, totalKg, cargoKg, emptyPalletKg, maxPallets, maxLdm, maxVol, ldmPct, weightPct, volPct, fits, freightClass };
  }, [palletKey, pallets, layers, height, cargoWeightPerPallet, pL, pW, palletType]);

  const bar = (pct: number, label: string, color: string) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`font-semibold ${pct > 90 ? "text-red-500" : pct > 70 ? "text-amber-500" : "text-green-600 dark:text-green-400"}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{L("Loadmetre (LDM) Calculator", "Calculateur de Mètres Linéaires (ML)")}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
            {L("A Loadmetre (LDM) represents 1 metre of trailer floor length × full trailer width (2.4 m). Used for groupage and partial loads across Europe.", "Un mètre linéaire (ML) représente 1 mètre de longueur de plancher × pleine largeur de remorque (2,4 m). Utilisé pour les envois groupage et les chargements partiels en Europe.")}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300">{L("Cargo Details", "Détails de la marchandise")}</h3>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Pallet type", "Type de palette")}</label>
            <select value={palletKey} onChange={e => setPalletKey(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40">
              {PALLET_TYPES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          {palletKey === "custom" && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Length (m)", "Longueur (m)")}</label>
                <input type="number" step="0.01" min="0.4" max="2.4" value={customL} onChange={e => setCustomL(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Width (m)", "Largeur (m)")}</label>
                <input type="number" step="0.01" min="0.4" max="2.4" value={customW} onChange={e => setCustomW(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
              </div>
            </div>
          )}

          {[
            { label: L("Number of pallets", "Nombre de palettes"), val: pallets, set: setPallets, min: "1", max: "80", step: "1" },
            { label: L("Layers per pallet", "Couches par palette"), val: layers, set: setLayers, min: "1", max: "4", step: "1" },
            { label: L("Height per layer (m)", "Hauteur par couche (m)"), val: height, set: setHeight, min: "0.5", max: "2.7", step: "0.05" },
            { label: L("Cargo weight per pallet (kg)", "Poids marchandise par palette (kg)"), val: cargoWeightPerPallet, set: setCargoWeightPerPallet, min: "0", max: "2000", step: "10" },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
              <input type="number" min={min} max={max} step={step} value={val} onChange={e => set(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300">{L("Results", "Résultats")}</h3>

          {/* Main result */}
          <div className={`rounded-xl p-5 border-2 ${result.fits ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-red-400 bg-red-50 dark:bg-red-900/20"}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`text-lg font-black ${result.fits ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}>
                {result.ldmTotal.toFixed(2)} LDM
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.fits ? "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300" : "bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300"}`}>
                {result.fits ? L("Fits in 1 trailer", "1 remorque suffisante") : L("Oversize", "Dépassement")}
              </span>
            </div>
            <p className={`text-sm font-semibold ${result.fits ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}>{result.freightClass}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {result.ldmPerPallet.toFixed(3)} LDM {L("per pallet", "par palette")} · {result.perRow} {L("pallets/row", "pal./rangée")}
            </p>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: L("LDM needed", "ML nécessaires"), val: `${result.ldmTotal.toFixed(2)} m`, sub: `/ 13.6 m` },
              { label: L("Total volume", "Volume total"), val: `${result.volTotal.toFixed(1)} m³`, sub: `/ ${(TRAILER_L * TRAILER_W * TRAILER_H).toFixed(0)} m³` },
              { label: L("Total weight", "Poids total"), val: `${(result.totalKg / 1000).toFixed(2)} t`, sub: `/ 24 t` },
            ].map(({ label, val, sub }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 mb-1">{label}</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{val}</div>
                <div className="text-[10px] text-slate-400">{sub}</div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-3">
            {bar(result.ldmPct, `LDM — ${result.ldmTotal.toFixed(2)} / ${TRAILER_L} m`, result.ldmPct > 90 ? "bg-red-500" : result.ldmPct > 70 ? "bg-amber-400" : "bg-blue-500")}
            {bar(result.weightPct, `${L("Weight", "Poids")} — ${(result.totalKg / 1000).toFixed(2)} / 24 t`, result.weightPct > 90 ? "bg-red-500" : result.weightPct > 70 ? "bg-amber-400" : "bg-green-500")}
            {bar(result.volPct, `${L("Volume", "Volume")} — ${result.volTotal.toFixed(1)} / ${(TRAILER_L * TRAILER_W * TRAILER_H).toFixed(0)} m³`, result.volPct > 90 ? "bg-red-500" : "bg-purple-500")}
          </div>
        </div>
      </div>

      {/* Reference table */}
      <div>
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-3">{L("Standard LDM Reference", "Référence ML standard")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                {[L("Pallet", "Palette"), "LDM/pal.", L("Pallets/row", "Pal./rangée"), L("Max in 13.6m trailer", "Max en semi 13,6m"), L("Freight type", "Type d'envoi")].map(h => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "EUR (120×80)", ldm: "0.40", pRow: 3, max: 33, type: L("Groupage / FTL", "Groupage / FTL") },
                { name: "UK (120×100)", ldm: "0.60", pRow: 2, max: 22, type: L("Groupage / FTL", "Groupage / FTL") },
                { name: "Demi-EUR (80×60)", ldm: "0.27", pRow: 4, max: 68, type: "Groupage" },
                { name: "EUR 2 (120×100)", ldm: "0.60", pRow: 2, max: 22, type: L("Groupage / FTL", "Groupage / FTL") },
              ].map(r => (
                <tr key={r.name} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{r.name}</td>
                  <td className="px-3 py-2.5 font-mono text-blue-600 dark:text-blue-400">{r.ldm} LDM</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{r.pRow}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{r.max}</td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{r.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">* {L("Trailer: 13.6m × 2.4m × 2.7m, max 24t. LDM = pallet length ÷ pallets per row.", "Semi-remorque : 13,6m × 2,4m × 2,7m, max 24t. ML = longueur palette ÷ palettes par rangée.")}</p>
      </div>
    </div>
  );
}
