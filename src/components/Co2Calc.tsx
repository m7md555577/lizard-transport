import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Leaf, TrendingDown, Info } from "lucide-react";

interface Mode {
  key: string;
  label_en: string;
  label_fr: string;
  emoji: string;
  co2PerTKm: number; // kg CO₂ per tonne-km
  color: string;
  bar: string;
  note_en: string;
  note_fr: string;
}

const MODES: Mode[] = [
  { key: "road_euro6", label_en: "Euro VI Truck", label_fr: "Camion Euro VI", emoji: "🚛", co2PerTKm: 0.062, color: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500", note_en: "Best available diesel truck (EU standard since 2014)", note_fr: "Meilleur camion diesel disponible (norme UE depuis 2014)" },
  { key: "road_old",   label_en: "Old Truck (Euro III)", label_fr: "Vieux camion (Euro III)", emoji: "🚚", co2PerTKm: 0.105, color: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500", note_en: "Pre-2005 trucks. Much higher emissions.", note_fr: "Camions avant 2005. Émissions beaucoup plus élevées." },
  { key: "van",        label_en: "Diesel Van (3.5t)", label_fr: "Camionnette diesel (3,5t)", emoji: "🚐", co2PerTKm: 0.150, color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", note_en: "Urban delivery vans. High per-tonne emissions due to small payload.", note_fr: "Camionnettes urbaines. Émissions élevées par tonne vu la faible charge." },
  { key: "rail",       label_en: "Electric Train (rail)", label_fr: "Train électrique (ferroviaire)", emoji: "🚂", co2PerTKm: 0.006, color: "text-green-600 dark:text-green-400", bar: "bg-green-500", note_en: "Electric rail freight — the greenest land transport mode.", note_fr: "Fret ferroviaire électrique — le mode terrestre le plus écologique." },
  { key: "sea",        label_en: "Deep-Sea Container Ship", label_fr: "Navire porte-conteneurs", emoji: "🚢", co2PerTKm: 0.010, color: "text-teal-600 dark:text-teal-400", bar: "bg-teal-500", note_en: "Very efficient per tonne-km over long distances.", note_fr: "Très efficace par tonne-km sur les longues distances." },
  { key: "air",        label_en: "Air Freight", label_fr: "Fret aérien", emoji: "✈️", co2PerTKm: 0.673, color: "text-red-600 dark:text-red-400", bar: "bg-red-500", note_en: "Highest emission mode. ~68× more than sea freight.", note_fr: "Mode le plus polluant. ~68× plus que le fret maritime." },
];

const TREE_ABSORPTION_KG_YEAR = 21; // kg CO₂ per tree per year
const CAR_KM_PER_KG_CO2 = 6.8;     // km equivalent per kg CO₂ (avg 147g/km car)
const CO2_OFFSET_EUR_PER_TONNE = 25; // EU ETS approximate price (€/tonne CO₂)

export default function Co2Calc() {
  const { lang } = useApp();
  const L = (en: string, fr: string) => lang === "fr" ? fr : en;

  const [distanceKm, setDistanceKm] = useState("1000");
  const [weightT, setWeightT] = useState("10");
  const [primaryMode, setPrimaryMode] = useState("road_euro6");

  const result = useMemo(() => {
    const dist = parseFloat(distanceKm) || 0;
    const weight = parseFloat(weightT) || 0;
    const tkm = dist * weight; // tonne-kilometres

    return MODES.map(m => {
      const co2Kg = tkm * m.co2PerTKm;
      const co2T = co2Kg / 1000;
      const trees = co2Kg / TREE_ABSORPTION_KG_YEAR;
      const carKm = co2Kg * CAR_KM_PER_KG_CO2;
      const offsetEur = co2T * CO2_OFFSET_EUR_PER_TONNE;
      return { ...m, co2Kg, co2T, trees, carKm, offsetEur, tkm };
    });
  }, [distanceKm, weightT]);

  const primary = result.find(r => r.key === primaryMode)!;
  const rail = result.find(r => r.key === "rail")!;
  const sea = result.find(r => r.key === "sea")!;
  const maxCo2 = Math.max(...result.map(r => r.co2Kg));

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex gap-3">
        <Leaf size={18} className="text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-700 dark:text-green-300 text-sm">{L("Carbon Footprint Calculator", "Calculateur d'empreinte carbone")}</p>
          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">
            {L("Based on ADEME (France) and IPCC emission factors. Results are indicative estimates for educational purposes.", "Basé sur les facteurs d'émission de l'ADEME et du GIEC. Résultats estimatifs à titre indicatif et éducatif.")}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: L("Distance (km)", "Distance (km)"), val: distanceKm, set: setDistanceKm, min: "1", max: "15000", step: "50" },
          { label: L("Cargo weight (tonnes)", "Poids marchandise (tonnes)"), val: weightT, set: setWeightT, min: "0.1", max: "30", step: "0.5" },
        ].map(({ label, val, set, min, max, step }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
            <input type="number" min={min} max={max} step={step} value={val} onChange={e => set(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Primary transport mode", "Mode de transport principal")}</label>
          <select value={primaryMode} onChange={e => setPrimaryMode(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40">
            {MODES.map(m => <option key={m.key} value={m.key}>{m.emoji} {L(m.label_en, m.label_fr)}</option>)}
          </select>
        </div>
      </div>

      {/* Primary result */}
      <div className="bg-gradient-to-br from-[#1a2e4a] to-blue-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{primary.emoji}</span>
          <div>
            <div className="font-bold">{L(primary.label_en, primary.label_fr)}</div>
            <div className="text-blue-200 text-xs">{L(primary.note_en, primary.note_fr)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: L("CO₂ emitted", "CO₂ émis"), val: primary.co2Kg >= 1000 ? `${primary.co2T.toFixed(2)} t` : `${primary.co2Kg.toFixed(1)} kg`, sub: "CO₂" },
            { label: L("Carbon offset cost", "Coût de compensation"), val: `€${primary.offsetEur.toFixed(0)}`, sub: L("at €25/tonne CO₂", "à 25€/tonne CO₂") },
            { label: L("Trees needed (1 year)", "Arbres requis (1 an)"), val: primary.trees < 1 ? `${primary.trees.toFixed(2)}` : `${Math.ceil(primary.trees)}`, sub: L("trees/year", "arbres/an") },
            { label: L("Car equivalent", "Équivalent voiture"), val: `${(primary.carKm / 1000).toFixed(0)} km`, sub: L("avg. petrol car", "voiture essence moy.") },
          ].map(({ label, val, sub }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-[10px] text-blue-200 mb-1">{label}</div>
              <div className="font-bold text-lg leading-tight">{val}</div>
              <div className="text-[10px] text-blue-300">{sub}</div>
            </div>
          ))}
        </div>
        {(primaryMode !== "rail" && primaryMode !== "sea") && rail.co2Kg > 0 && (
          <div className="mt-4 bg-green-500/20 border border-green-400/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <TrendingDown size={14} className="text-green-300 shrink-0" />
            <p className="text-xs text-green-200">
              {L(`Switching to electric rail would save ${((primary.co2Kg - rail.co2Kg) / 1000).toFixed(2)} t CO₂ (−${Math.round((primary.co2Kg - rail.co2Kg) / primary.co2Kg * 100)}%)`,
                `Passer au train électrique économiserait ${((primary.co2Kg - rail.co2Kg) / 1000).toFixed(2)} t CO₂ (−${Math.round((primary.co2Kg - rail.co2Kg) / primary.co2Kg * 100)}%)`)}
            </p>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-3">{L("All modes comparison", "Comparaison tous modes")}</h3>
        <div className="space-y-2">
          {result.sort((a, b) => a.co2Kg - b.co2Kg).map(m => {
            const pct = maxCo2 > 0 ? Math.round((m.co2Kg / maxCo2) * 100) : 0;
            const isPrimary = m.key === primaryMode;
            return (
              <div key={m.key} className={`rounded-xl border p-3 transition-all ${isPrimary ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isPrimary ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>{L(m.label_en, m.label_fr)}</span>
                      <span className={`text-sm font-bold ${m.color}`}>
                        {m.co2Kg >= 1000 ? `${m.co2T.toFixed(2)} t CO₂` : `${m.co2Kg.toFixed(1)} kg CO₂`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${m.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400 pl-8">
                  <span>{m.co2PerTKm * 1000} {L("g CO₂/t·km", "g CO₂/t·km")}</span>
                  <span>€{m.offsetEur.toFixed(0)} {L("offset", "compensation")}</span>
                  <span>{Math.ceil(m.trees)} {L("trees/yr", "arbres/an")}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {L("Sources: ADEME Bilan Carbone, IPCC AR6, EU ETS 2024. Emission factors in kg CO₂ per tonne-kilometre.", "Sources : ADEME Bilan Carbone, GIEC AR6, SEQE-UE 2024. Facteurs en kg CO₂ par tonne-kilomètre.")}
        </p>
      </div>

      {/* EU context */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-slate-400" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{L("EU Green Transport Policy", "Politique européenne de transport vert")}</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
          {[
            { icon: "📋", text: L("EU ETS (Emissions Trading System): road transport included from 2027", "SEQE-UE : transport routier inclus à partir de 2027") },
            { icon: "🎯", text: L("EU Green Deal: −55% transport emissions by 2030 vs 1990", "Pacte vert UE : −55% émissions transport d'ici 2030 vs 1990") },
            { icon: "🚛", text: L("Euro VII regulation (from 2025): stricter limits on NOₓ and PM", "Euro VII (dès 2025) : limites plus strictes sur NOₓ et PM") },
            { icon: "🌱", text: L("Modal shift targets: 30% cargo from road to rail/sea by 2030", "Report modal : 30% du fret routier vers rail/mer d'ici 2030") },
          ].map(({ icon, text }) => (
            <div key={text} className="flex gap-2">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
