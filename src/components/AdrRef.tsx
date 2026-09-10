import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Search, AlertTriangle, Info, FileText } from "lucide-react";

interface AdrClass {
  num: string;
  label_en: string;
  label_fr: string;
  placard: string;
  bg: string;
  text: string;
  border: string;
  examples_en: string;
  examples_fr: string;
  req_en: string[];
  req_fr: string[];
  incompatible: string[];
}

const ADR_CLASSES: AdrClass[] = [
  {
    num: "1", label_en: "Explosives", label_fr: "Matières et objets explosibles",
    placard: "💥", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-200", border: "border-orange-300 dark:border-orange-700",
    examples_en: "Ammunition, fireworks, airbag inflators, mining explosives", examples_fr: "Munitions, feux d'artifice, gonfleurs d'airbags, explosifs miniers",
    req_en: ["Dangerous goods transport document (DGD)", "UN orange placards mandatory", "Driver must hold ADR certificate (1.3 training minimum)", "Fire extinguisher required (2×6kg or 2×6L)", "Emergency information in driver's language", "Tunnel code B (or C/D/E depending on division)"],
    req_fr: ["Document de transport marchandises dangereuses (DGD)", "Plaques orange obligatoires", "Chauffeur doit avoir certificat ADR (formation 1.3 min.)", "Extincteur requis (2×6kg ou 2×6L)", "Consignes écrites en langue du chauffeur", "Code tunnel B (ou C/D/E selon division)"],
    incompatible: ["2", "3", "4", "5", "6"]
  },
  {
    num: "2", label_en: "Gases", label_fr: "Gaz",
    placard: "💨", bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-800 dark:text-cyan-200", border: "border-cyan-300 dark:border-cyan-700",
    examples_en: "LPG, oxygen, hydrogen, aerosols, fire extinguishers, helium", examples_fr: "GPL, oxygène, hydrogène, aérosols, extincteurs, hélium",
    req_en: ["DGD required above threshold quantities", "Specific placard per gas type (2.1 flammable, 2.2 non-flammable, 2.3 toxic)", "Tank must be ADR-approved", "Temperature control for cryogenic gases", "No smoking within 3m of vehicle"],
    req_fr: ["DGD requis au-dessus des seuils", "Panneaux spécifiques selon type (2.1 inflammable, 2.2 non inflammable, 2.3 toxique)", "Citerne doit être homologuée ADR", "Contrôle température pour gaz cryogéniques", "Défense de fumer à moins de 3m du véhicule"],
    incompatible: ["1", "5", "6"]
  },
  {
    num: "3", label_en: "Flammable Liquids", label_fr: "Liquides inflammables",
    placard: "🔥", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200", border: "border-red-300 dark:border-red-700",
    examples_en: "Petrol, diesel, ethanol, acetone, paints, varnishes, adhesives", examples_fr: "Essence, gazole, éthanol, acétone, peintures, vernis, adhésifs",
    req_en: ["DGD required >1000L or >450kg", "Orange plates with UN number and hazard ID", "Static earthing during loading/unloading", "No open flames within loading zone", "Flame-proof electrical equipment in tank vehicles", "Vapour recovery systems for Class I liquids"],
    req_fr: ["DGD requis >1000L ou >450kg", "Plaques orange avec numéro ONU et code danger", "Mise à la terre lors du chargement/déchargement", "Pas de flammes nues dans la zone de chargement", "Équipements électriques antidéflagrants pour citernes", "Récupération de vapeurs pour liquides de catégorie I"],
    incompatible: ["1", "5.1", "5.2"]
  },
  {
    num: "4", label_en: "Flammable Solids", label_fr: "Matières solides inflammables",
    placard: "🪵", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-200", border: "border-red-300 dark:border-red-700",
    examples_en: "Matches, sulphur, metal powders, nitrocellulose, self-reactive substances", examples_fr: "Allumettes, soufre, poudres métalliques, nitrocellulose, matières autoréactives",
    req_en: ["DGD required", "Keep away from heat and ignition sources", "4.1 (flammable solid), 4.2 (spontaneously combustible), 4.3 (dangerous when wet)", "Water-reactive materials (4.3): no water extinguisher", "Store separately from oxidisers"],
    req_fr: ["DGD requis", "Éloigner des sources de chaleur et d'inflammation", "4.1 (solide inflammable), 4.2 (spontanément combustible), 4.3 (dangereux au contact de l'eau)", "Matières réactives à l'eau (4.3) : pas d'extincteur à eau", "Stocker séparément des oxydants"],
    incompatible: ["1", "5", "6"]
  },
  {
    num: "5", label_en: "Oxidising Substances & Organic Peroxides", label_fr: "Matières comburantes et peroxydes organiques",
    placard: "🌡️", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", border: "border-yellow-300 dark:border-yellow-700",
    examples_en: "Hydrogen peroxide, nitrates, bleach, ammonium nitrate, organic peroxides", examples_fr: "Eau oxygénée, nitrates, javel, nitrate d'ammonium, peroxydes organiques",
    req_en: ["DGD required", "5.1 (oxidising): can ignite combustible materials on contact", "5.2 (organic peroxides): temperature-controlled transport often required", "Keep away from flammable materials and heat", "Specific extinguisher: large volumes of water", "Organic peroxides may require refrigeration during transport"],
    req_fr: ["DGD requis", "5.1 (comburant) : peut enflammer matières combustibles au contact", "5.2 (peroxydes organiques) : transport souvent sous contrôle de température", "Éloigner des matières inflammables et de la chaleur", "Extincteur spécifique : grande quantité d'eau", "Peroxydes organiques : réfrigération souvent requise"],
    incompatible: ["1", "3", "4"]
  },
  {
    num: "6", label_en: "Toxic & Infectious Substances", label_fr: "Matières toxiques et infectieuses",
    placard: "☠️", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-200", border: "border-purple-300 dark:border-purple-700",
    examples_en: "Pesticides, cyanides, medical waste, biological samples, viral cultures", examples_fr: "Pesticides, cyanures, déchets médicaux, échantillons biologiques, cultures virales",
    req_en: ["6.1 (toxic): DGD + safety data sheet", "6.2 (infectious): UN 2814/2900 — Category A pathogens require specific packaging P650", "Special training for infectious substances", "Triple packaging required (primary + secondary + outer)", "Keep refrigerated for Category A biological agents"],
    req_fr: ["6.1 (toxique) : DGD + fiche de données de sécurité", "6.2 (infectieux) : ONU 2814/2900 — agents catégorie A requièrent emballage P650", "Formation spécifique pour matières infectieuses", "Triple emballage requis (primaire + secondaire + externe)", "Maintenir réfrigéré pour agents biologiques catégorie A"],
    incompatible: ["1", "2", "3", "4", "5", "8"]
  },
  {
    num: "7", label_en: "Radioactive Materials", label_fr: "Matières radioactives",
    placard: "☢️", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", border: "border-yellow-300 dark:border-yellow-700",
    examples_en: "Medical isotopes, industrial radiography equipment, nuclear fuel, smoke detectors (Am-241)", examples_fr: "Isotopes médicaux, équipements de radiographie industrielle, combustible nucléaire, détecteurs de fumée (Am-241)",
    req_en: ["Category I (white), II (yellow), III (yellow) labels based on radiation level", "Transport Index (TI) must be marked on package", "Criticality Safety Index (CSI) for fissile materials", "Vehicle must bear RADIOACTIVE placards", "Radiation monitoring required during transport", "Special IAEA regulations apply (TS-R-1)"],
    req_fr: ["Étiquettes catégorie I (blanche), II (jaune), III (jaune) selon niveau de radiation", "Transport Index (TI) inscrit sur le colis", "Criticality Safety Index (CSI) pour matières fissiles", "Véhicule doit porter plaques RADIOACTIVE", "Surveillance des rayonnements pendant le transport", "Réglements spéciaux AIEA (TS-R-1)"],
    incompatible: ["All — must be separated from passengers and undeveloped photographic film"]
  },
  {
    num: "8", label_en: "Corrosive Substances", label_fr: "Matières corrosives",
    placard: "🧪", bg: "bg-slate-100 dark:bg-slate-700/60", text: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-600",
    examples_en: "Sulphuric acid, hydrochloric acid, caustic soda, batteries, electroplating solutions", examples_fr: "Acide sulfurique, acide chlorhydrique, soude caustique, batteries, solutions galvaniques",
    req_en: ["DGD required above thresholds", "Packaging must be leak-proof and resistant to corrosion", "Protective equipment required (gloves, goggles)", "Compatible packaging materials: glass, polyethylene, stainless steel", "Batteries (Class 8): must be protected against short-circuit"],
    req_fr: ["DGD requis au-dessus des seuils", "Emballage étanche et résistant à la corrosion", "Équipements de protection requis (gants, lunettes)", "Matériaux d'emballage compatibles : verre, polyéthylène, inox", "Batteries (classe 8) : protéger contre les courts-circuits"],
    incompatible: ["1", "5", "6", "7"]
  },
  {
    num: "9", label_en: "Miscellaneous Dangerous Substances", label_fr: "Matières et objets dangereux divers",
    placard: "⚠️", bg: "bg-slate-100 dark:bg-slate-700/60", text: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-600",
    examples_en: "Lithium batteries, dry ice, magnetised material, elevated temperature materials, hazardous waste", examples_fr: "Batteries lithium, glace carbonique, matières magnétisées, matières à haute température, déchets dangereux",
    req_en: ["Lithium batteries (UN 3090/3480): >300Wh require Class 9 labelling and DGD", "Dry ice (UN 1845): ventilated vehicle required, CO₂ warning label", "Magnetised material: 5m clearance from compass/navigation equipment", "Environmentally hazardous: fish symbol label", "Elevated temperature: vehicle and driver protection required"],
    req_fr: ["Batteries lithium (ONU 3090/3480) : >300Wh nécessitent étiquette classe 9 et DGD", "Glace carbonique (ONU 1845) : véhicule ventilé requis, étiquette CO₂", "Matières magnétisées : 5m de tout compas/équipement de navigation", "Dangereux pour l'environnement : étiquette poisson", "Matières à haute température : protection véhicule et chauffeur"],
    incompatible: ["Varies by UN number — check ADR table A"]
  },
];

const COMMON_UN: { un: string; name_en: string; name_fr: string; class: string; pg: string; tunnel: string }[] = [
  { un: "1202", name_en: "Diesel fuel / gas oil", name_fr: "Gazole / fuel lourd", class: "3", pg: "III", tunnel: "D/E" },
  { un: "1203", name_en: "Motor spirit (petrol)", name_fr: "Essence moteur", class: "3", pg: "II", tunnel: "D/E" },
  { un: "1072", name_en: "Oxygen, compressed", name_fr: "Oxygène comprimé", class: "2.2", pg: "—", tunnel: "E" },
  { un: "1978", name_en: "Propane (LPG)", name_fr: "Propane (GPL)", class: "2.1", pg: "—", tunnel: "B/D" },
  { un: "3480", name_en: "Lithium ion batteries", name_fr: "Batteries lithium-ion", class: "9", pg: "II", tunnel: "—" },
  { un: "1789", name_en: "Hydrochloric acid", name_fr: "Acide chlorhydrique", class: "8", pg: "II/III", tunnel: "E" },
  { un: "2794", name_en: "Batteries, wet (lead acid)", name_fr: "Batteries acide plomb", class: "8", pg: "—", tunnel: "E" },
  { un: "1845", name_en: "Carbon dioxide, solid (dry ice)", name_fr: "Dioxyde de carbone solide (glace carbonique)", class: "9", pg: "III", tunnel: "—" },
  { un: "1170", name_en: "Ethanol / ethyl alcohol", name_fr: "Éthanol / alcool éthylique", class: "3", pg: "II", tunnel: "D/E" },
  { un: "2814", name_en: "Infectious substance (human)", name_fr: "Matière infectieuse (homme)", class: "6.2", pg: "—", tunnel: "—" },
  { un: "2067", name_en: "Ammonium nitrate fertilisers", name_fr: "Engrais au nitrate d'ammonium", class: "5.1", pg: "III", tunnel: "E" },
  { un: "1090", name_en: "Acetone", name_fr: "Acétone", class: "3", pg: "II", tunnel: "D/E" },
];

export default function AdrRef() {
  const { lang } = useApp();
  const L = (en: string, fr: string) => lang === "fr" ? fr : en;

  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [tab, setTab] = useState<"classes" | "un" | "doc" | "lq">("classes");
  const [search, setSearch] = useState("");

  const cls = ADR_CLASSES.find(c => c.num === activeClass);

  const filteredUn = COMMON_UN.filter(u =>
    search === "" ||
    u.un.includes(search) ||
    u.name_en.toLowerCase().includes(search.toLowerCase()) ||
    u.name_fr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">{L("ADR 2023 — European Agreement on Dangerous Goods by Road", "ADR 2023 — Accord européen sur le transport de marchandises dangereuses par route")}</p>
          <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">{L("Educational reference only. Always consult the official ADR 2023 publication for compliance.", "Référence éducative uniquement. Toujours consulter la publication officielle ADR 2023 pour la conformité.")}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2">
        {(["classes", "un", "doc", "lq"] as const).map(t => {
          const labels = { classes: ["9 Classes", "9 Classes"], un: ["UN Numbers", "Numéros ONU"], doc: ["Required Docs", "Documents requis"], lq: ["Limited Qty", "Quantités limitées"] };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === t ? "bg-[#1a2e4a] dark:bg-blue-700 text-white border-transparent" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"}`}>
              {L(labels[t][0], labels[t][1])}
            </button>
          );
        })}
      </div>

      {/* Classes tab */}
      {tab === "classes" && (
        <div className="grid md:grid-cols-[180px_1fr] gap-4">
          <div className="flex md:flex-col gap-2 flex-wrap">
            {ADR_CLASSES.map(c => (
              <button key={c.num} onClick={() => setActiveClass(activeClass === c.num ? null : c.num)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left ${activeClass === c.num ? `${c.bg} ${c.border} ${c.text}` : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}>
                <span className="text-base">{c.placard}</span>
                <span>{L(`Class ${c.num}`, `Classe ${c.num}`)}</span>
              </button>
            ))}
          </div>

          {cls ? (
            <div className={`${cls.bg} border ${cls.border} rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/60 dark:bg-black/20 rounded-xl flex items-center justify-center text-3xl">{cls.placard}</div>
                <div>
                  <h3 className={`font-bold text-lg ${cls.text}`}>{L(`Class ${cls.num}: ${cls.label_en}`, `Classe ${cls.num} : ${cls.label_fr}`)}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{L("Examples:", "Exemples :")} {L(cls.examples_en, cls.examples_fr)}</div>
                </div>
              </div>

              <div>
                <h4 className={`font-semibold text-sm mb-2 ${cls.text}`}>{L("Transport Requirements", "Exigences de transport")}</h4>
                <ul className="space-y-1.5">
                  {(lang === "fr" ? cls.req_fr : cls.req_en).map((req, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 shrink-0">•</span> {req}
                    </li>
                  ))}
                </ul>
              </div>

              {cls.incompatible.length > 0 && (
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{L("Incompatible with:", "Incompatible avec :")}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{L("Class", "Classe")} {cls.incompatible.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 text-sm">
              {L("Select a class to see details", "Sélectionnez une classe pour voir les détails")}
            </div>
          )}
        </div>
      )}

      {/* UN Numbers tab */}
      {tab === "un" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={L("Search by UN number, name…", "Rechercher par numéro ONU, nom…")} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                  {["UN No.", L("Substance", "Substance"), L("Class", "Classe"), "PG", L("Tunnel code", "Code tunnel")].map(h => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUn.map(u => (
                  <tr key={u.un} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono font-bold text-[#1a2e4a] dark:text-blue-400">UN {u.un}</td>
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{L(u.name_en, u.name_fr)}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{L("Class", "Cl.")} {u.class}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">{u.pg}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{u.tunnel || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">{L("PG = Packing Group (I = high danger, II = medium, III = low). 12 common substances shown.", "GE = Groupe d'emballage (I = grand danger, II = moyen, III = faible). 12 substances courantes affichées.")}</p>
        </div>
      )}

      {/* Required Documents tab */}
      {tab === "doc" && (
        <div className="space-y-3">
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300">{L("Mandatory ADR Documents", "Documents ADR obligatoires")}</h3>
          {[
            { icon: "📄", title: L("Dangerous Goods Transport Document (DGD)", "Lettre de voiture / Document de transport MDR"), desc: L("Mandatory for all dangerous goods shipments. Must include: UN number, proper shipping name, hazard class, packing group, quantity.", "Obligatoire pour tout envoi MDR. Doit mentionner : numéro ONU, désignation officielle, classe de danger, groupe d'emballage, quantité."), req: true },
            { icon: "💊", title: L("Safety Data Sheets (SDS / MSDS)", "Fiches de données de sécurité (FDS)"), desc: L("Required for hazardous chemicals (Classes 3, 6.1, 8). 16-section format per EU REACH Regulation (EC) 1907/2006.", "Requises pour produits chimiques dangereux (classes 3, 6.1, 8). Format 16 rubriques selon REACH (CE) 1907/2006."), req: true },
            { icon: "📋", title: L("Written Instructions (Tremcard)", "Consignes écrites (Tremcard)"), desc: L("Must be in the vehicle cab and in the driver's language. Contains emergency procedures for each UN number transported.", "Doit se trouver dans la cabine et être dans la langue du chauffeur. Contient les procédures d'urgence pour chaque numéro ONU."), req: true },
            { icon: "🪪", title: L("ADR Driver Certificate", "Certificat de formation ADR chauffeur"), desc: L("Valid for 5 years. Basic + specialisation (tanker, explosives, radioactive). Issued after approved training and examination.", "Valable 5 ans. Basique + spécialisation (citerne, explosifs, radioactifs). Délivré après formation agréée et examen."), req: true },
            { icon: "📍", title: L("Vehicle Approval Certificate", "Certificat d'agrément du véhicule"), desc: L("Required for tanks, tank containers and bulk vehicles. Issued by national authority. Annual renewal.", "Requis pour citernes, conteneurs-citernes et véhicules en vrac. Délivré par autorité nationale. Renouvellement annuel."), req: false },
            { icon: "⚠️", title: L("Orange Plates & Labels", "Plaques orange et étiquettes"), desc: L("Front + rear rectangular orange plates on the vehicle. Specific hazard labels on packages. Tunnel codes displayed where applicable.", "Plaques orange rectangulaires avant + arrière du véhicule. Étiquettes de danger spécifiques sur les colis. Codes tunnel affichés si applicable."), req: true },
          ].map(({ icon, title, desc, req }) => (
            <div key={title} className={`rounded-xl border p-4 flex gap-3 ${req ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h4>
                  {req && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">{L("MANDATORY", "OBLIGATOIRE")}</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limited Quantities tab */}
      {tab === "lq" && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex gap-3">
            <Info size={16} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300 text-sm">{L("Limited Quantities (LQ) — ADR Chapter 3.4", "Quantités limitées (QL) — Chapitre ADR 3.4")}</p>
              <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">{L("Limited quantities allow dangerous goods to be transported with fewer requirements (no orange plates, no ADR driver certificate required).", "Les quantités limitées permettent de transporter des MDR avec moins d'obligations (pas de plaques orange, pas de certificat ADR chauffeur requis).")}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                  {[L("Class", "Classe"), "LQ Max/inner", "LQ Max/outer (kg)", L("Mark", "Marque"), L("Key exemptions", "Exemptions clés")].map(h => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { cls: "3", max: "1L", outer: "30", mark: "♦ LQ", ex: L("No DGD, no orange plates", "Pas de DGD, pas de plaques orange") },
                  { cls: "5.1", max: "1kg", outer: "30", mark: "♦ LQ", ex: L("No ADR driver certificate needed", "Pas de certificat ADR chauffeur") },
                  { cls: "6.1 (PG III)", max: "5L/kg", outer: "30", mark: "♦ LQ", ex: L("Simplified packaging rules", "Règles emballage simplifiées") },
                  { cls: "8", max: "1L/kg", outer: "30", mark: "♦ LQ", ex: L("No specialised vehicle needed", "Pas de véhicule spécialisé") },
                  { cls: "9", max: "5kg/L", outer: "30", mark: "♦ LQ", ex: L("Applies to most misc. substances", "S'applique à la plupart des matières diverses") },
                ].map(r => (
                  <tr key={r.cls} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-bold text-amber-600 dark:text-amber-400">{L("Class", "Classe")} {r.cls}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-200">{r.max}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-200">{r.outer} kg</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{r.mark}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{r.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">{L("Classes 1, 2, 4, 6.2, 7 are NOT eligible for LQ provisions. Always verify against ADR Table 3.4.", "Classes 1, 2, 4, 6.2, 7 ne sont PAS éligibles aux dispositions QL. Vérifier toujours dans le tableau ADR 3.4.")}</p>
        </div>
      )}
    </div>
  );
}
