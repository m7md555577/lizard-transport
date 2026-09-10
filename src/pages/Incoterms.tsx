import { useState } from "react";
import { RotateCcw, ChevronRight, CheckCircle, BookOpen, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";

type Lang = "en" | "fr" | "ar";
type Answer = "seller" | "buyer" | "yes" | "no";
type PageTab = "wizard" | "reference";

// ─── Wizard Questions ──────────────────────────────────────────────────────
interface Question {
  id: number;
  q_en: string; q_fr: string;
  hint_en: string; hint_fr: string;
  options: { value: Answer; label_en: string; label_fr: string; emoji: string }[];
}

interface IncotermResult {
  code: string;
  name_en: string; name_fr: string;
  mode_en: string; mode_fr: string;
  desc_en: string; desc_fr: string;
  color: string; textColor: string;
  risk_transfer_en: string; risk_transfer_fr: string;
  responsibilities: { item_en: string; item_fr: string; seller: boolean; buyer: boolean }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    q_en: "Who organises the main transport?", q_fr: "Qui organise le transport principal ?",
    hint_en: "Who books and manages the carrier / freight forwarder?",
    hint_fr: "Qui réserve et gère le transporteur / commissionnaire de transport ?",
    options: [
      { value: "seller", label_en: "The Seller", label_fr: "Le Vendeur", emoji: "🏭" },
      { value: "buyer", label_en: "The Buyer", label_fr: "L'Acheteur", emoji: "🏢" },
    ],
  },
  {
    id: 2,
    q_en: "Who pays the main transport cost?", q_fr: "Qui paie le coût principal du transport ?",
    hint_en: "Who bears the freight charges for the main carriage?",
    hint_fr: "Qui supporte les frais de fret pour le transport principal ?",
    options: [
      { value: "seller", label_en: "The Seller", label_fr: "Le Vendeur", emoji: "🏭" },
      { value: "buyer", label_en: "The Buyer", label_fr: "L'Acheteur", emoji: "🏢" },
    ],
  },
  {
    id: 3,
    q_en: "Is transport insurance required?", q_fr: "Une assurance transport est-elle requise ?",
    hint_en: "Does the contract or buyer require goods to be insured during transit?",
    hint_fr: "Le contrat ou l'acheteur exige-t-il une assurance des marchandises en transit ?",
    options: [
      { value: "yes", label_en: "Yes — Insurance required", label_fr: "Oui — Assurance requise", emoji: "🛡️" },
      { value: "no", label_en: "No — Not required", label_fr: "Non — Non requise", emoji: "⚖️" },
    ],
  },
  {
    id: 4,
    q_en: "Who handles import customs procedures?", q_fr: "Qui gère les formalités douanières à l'import ?",
    hint_en: "Who is responsible for customs clearance at the destination country?",
    hint_fr: "Qui est responsable du dédouanement dans le pays de destination ?",
    options: [
      { value: "seller", label_en: "The Seller", label_fr: "Le Vendeur", emoji: "🏭" },
      { value: "buyer", label_en: "The Buyer", label_fr: "L'Acheteur", emoji: "🏢" },
    ],
  },
];

const INCOTERMS_MAP: Record<string, IncotermResult> = {
  EXW: {
    code: "EXW", name_en: "Ex Works", name_fr: "À l'usine",
    mode_en: "All transport modes", mode_fr: "Tous modes de transport",
    desc_en: "The seller makes the goods available at their premises. The buyer takes responsibility for ALL transport, insurance, export and import formalities from that point.",
    desc_fr: "Le vendeur met les marchandises à disposition dans ses locaux. L'acheteur prend en charge TOUT le transport, l'assurance et les formalités douanières à l'export et à l'import.",
    color: "bg-slate-600", textColor: "text-slate-700 dark:text-slate-300",
    risk_transfer_en: "At seller's premises", risk_transfer_fr: "Dans les locaux du vendeur",
    responsibilities: [
      { item_en: "Export packaging", item_fr: "Emballage export", seller: true, buyer: false },
      { item_en: "Export customs", item_fr: "Douane export", seller: false, buyer: true },
      { item_en: "Pre-carriage / Loading", item_fr: "Pré-acheminement / Chargement", seller: false, buyer: true },
      { item_en: "Main freight / transport", item_fr: "Transport principal", seller: false, buyer: true },
      { item_en: "Transport insurance", item_fr: "Assurance transport", seller: false, buyer: true },
      { item_en: "Destination terminal fees", item_fr: "Frais terminal arrivée", seller: false, buyer: true },
      { item_en: "Import customs", item_fr: "Douane import", seller: false, buyer: true },
      { item_en: "Import duties & taxes", item_fr: "Droits et taxes import", seller: false, buyer: true },
    ],
  },
  FCA: {
    code: "FCA", name_en: "Free Carrier", name_fr: "Franco transporteur",
    mode_en: "All transport modes", mode_fr: "Tous modes de transport",
    desc_en: "The seller delivers the goods to a named carrier at a specified place. Risk transfers at that point. Buyer arranges main freight and pays transport costs.",
    desc_fr: "Le vendeur livre les marchandises au transporteur désigné au lieu convenu. Le risque est transféré à ce point. L'acheteur organise et paie le fret principal.",
    color: "bg-blue-600", textColor: "text-blue-700 dark:text-blue-400",
    risk_transfer_en: "Named place / carrier location", risk_transfer_fr: "Lieu désigné / remise au transporteur",
    responsibilities: [
      { item_en: "Export packaging", item_fr: "Emballage export", seller: true, buyer: false },
      { item_en: "Export customs", item_fr: "Douane export", seller: true, buyer: false },
      { item_en: "Pre-carriage to named place", item_fr: "Pré-acheminement au lieu convenu", seller: true, buyer: false },
      { item_en: "Main freight / transport", item_fr: "Transport principal", seller: false, buyer: true },
      { item_en: "Transport insurance", item_fr: "Assurance transport", seller: false, buyer: true },
      { item_en: "Destination terminal fees", item_fr: "Frais terminal arrivée", seller: false, buyer: true },
      { item_en: "Import customs", item_fr: "Douane import", seller: false, buyer: true },
      { item_en: "Import duties & taxes", item_fr: "Droits et taxes import", seller: false, buyer: true },
    ],
  },
  CIF: {
    code: "CIF", name_en: "Cost, Insurance & Freight", name_fr: "Coût, assurance et fret",
    mode_en: "Sea & inland waterway only", mode_fr: "Maritime et fluvial uniquement",
    desc_en: "The seller pays freight and insurance to the named port of destination. Risk transfers when goods are on board the ship. Buyer handles import customs.",
    desc_fr: "Le vendeur paie le fret et l'assurance jusqu'au port de destination désigné. Le risque est transféré lorsque les marchandises sont à bord du navire. L'acheteur gère les douanes à l'import.",
    color: "bg-cyan-700", textColor: "text-cyan-700 dark:text-cyan-400",
    risk_transfer_en: "On board vessel at port of origin", risk_transfer_fr: "À bord du navire au port d'origine",
    responsibilities: [
      { item_en: "Export packaging", item_fr: "Emballage export", seller: true, buyer: false },
      { item_en: "Export customs", item_fr: "Douane export", seller: true, buyer: false },
      { item_en: "Loading on vessel", item_fr: "Chargement navire", seller: true, buyer: false },
      { item_en: "Main freight / transport", item_fr: "Transport principal", seller: true, buyer: false },
      { item_en: "Transport insurance", item_fr: "Assurance transport", seller: true, buyer: false },
      { item_en: "Destination terminal fees", item_fr: "Frais terminal arrivée", seller: false, buyer: true },
      { item_en: "Import customs", item_fr: "Douane import", seller: false, buyer: true },
      { item_en: "Import duties & taxes", item_fr: "Droits et taxes import", seller: false, buyer: true },
    ],
  },
  DAP: {
    code: "DAP", name_en: "Delivered at Place", name_fr: "Rendu au lieu de destination",
    mode_en: "All transport modes", mode_fr: "Tous modes de transport",
    desc_en: "The seller delivers goods to a named destination, bearing all transport costs and risks up to that point. The buyer handles import customs and duties.",
    desc_fr: "Le vendeur livre les marchandises au lieu désigné, supportant tous les coûts et risques jusqu'à ce point. L'acheteur gère les formalités douanières et les droits à l'import.",
    color: "bg-green-700", textColor: "text-green-700 dark:text-green-400",
    risk_transfer_en: "Named place of destination (ready for unloading)",
    risk_transfer_fr: "Lieu de destination désigné (prêt pour déchargement)",
    responsibilities: [
      { item_en: "Export packaging", item_fr: "Emballage export", seller: true, buyer: false },
      { item_en: "Export customs", item_fr: "Douane export", seller: true, buyer: false },
      { item_en: "Main freight / transport", item_fr: "Transport principal", seller: true, buyer: false },
      { item_en: "Transport insurance", item_fr: "Assurance transport", seller: false, buyer: false },
      { item_en: "Destination terminal fees", item_fr: "Frais terminal arrivée", seller: true, buyer: false },
      { item_en: "Unloading at destination", item_fr: "Déchargement destination", seller: false, buyer: true },
      { item_en: "Import customs", item_fr: "Douane import", seller: false, buyer: true },
      { item_en: "Import duties & taxes", item_fr: "Droits et taxes import", seller: false, buyer: true },
    ],
  },
  DDP: {
    code: "DDP", name_en: "Delivered Duty Paid", name_fr: "Rendu droits acquittés",
    mode_en: "All transport modes", mode_fr: "Tous modes de transport",
    desc_en: "Maximum obligation for the seller. The seller delivers the goods to the buyer, cleared for import, with all duties and taxes paid. The buyer simply receives the goods.",
    desc_fr: "Obligation maximale pour le vendeur. Le vendeur livre les marchandises à l'acheteur, dédouanées à l'import, tous droits et taxes payés. L'acheteur reçoit simplement les marchandises.",
    color: "bg-purple-700", textColor: "text-purple-700 dark:text-purple-400",
    risk_transfer_en: "Named place of destination (import cleared)",
    risk_transfer_fr: "Lieu de destination désigné (dédouané à l'import)",
    responsibilities: [
      { item_en: "Export packaging", item_fr: "Emballage export", seller: true, buyer: false },
      { item_en: "Export customs", item_fr: "Douane export", seller: true, buyer: false },
      { item_en: "Main freight / transport", item_fr: "Transport principal", seller: true, buyer: false },
      { item_en: "Transport insurance", item_fr: "Assurance transport", seller: true, buyer: false },
      { item_en: "Destination terminal fees", item_fr: "Frais terminal arrivée", seller: true, buyer: false },
      { item_en: "Import customs", item_fr: "Douane import", seller: true, buyer: false },
      { item_en: "Import duties & taxes", item_fr: "Droits et taxes import", seller: true, buyer: false },
    ],
  },
};

function getRecommendation(answers: Answer[]): string {
  const [q1, q2, , q4] = answers;
  if (q1 === "buyer") return "EXW";
  if (q4 === "buyer") {
    if (q2 === "buyer") return "FCA";
    return answers[2] === "yes" ? "CIF" : "DAP";
  }
  return "DDP";
}

// ─── Full Reference Data ───────────────────────────────────────────────────
// S = seller, B = buyer, N = not applicable, O = optional
type Resp = "S" | "B" | "N" | "O";

interface IncoRef {
  code: string;
  name_fr: string;
  name_en: string;
  category: "depart" | "arrivee";
  mode: string; // maritime only or all
  color: string;
  resp: Resp[]; // 12 rows
}

const RESP_ROWS_FR = [
  "Emballage export",
  "Frais de chargement",
  "Transport pré-acheminement",
  "Douane export",
  "Frais terminal origine",
  "Chargement transport principal",
  "Transport principal",
  "Assurance transport",
  "Frais terminal arrivée",
  "Transport post-acheminement",
  "Déchargement destination",
  "Douane import et taxes",
];
const RESP_ROWS_EN = [
  "Export packaging",
  "Loading charges",
  "Pre-carriage",
  "Export customs",
  "Origin terminal fees",
  "Loading on main carrier",
  "Main freight",
  "Transport insurance",
  "Destination terminal fees",
  "Post-carriage",
  "Unloading at destination",
  "Import customs & duties",
];

const ALL_INCOTERMS: IncoRef[] = [
  // Ventes au départ
  { code: "EXW", name_fr: "À l'usine",              name_en: "Ex Works",                   category: "depart",  mode: "all",  color: "#64748b", resp: ["S","B","B","B","B","B","B","B","B","B","B","B"] },
  { code: "FCA", name_fr: "Franco transporteur",     name_en: "Free Carrier",                category: "depart",  mode: "all",  color: "#2563eb", resp: ["S","S","S","S","B","B","B","B","B","B","B","B"] },
  { code: "FAS", name_fr: "Franco le long du navire",name_en: "Free Alongside Ship",         category: "depart",  mode: "sea",  color: "#0891b2", resp: ["S","S","S","S","S","B","B","B","B","B","B","B"] },
  { code: "FOB", name_fr: "Franco à bord",           name_en: "Free On Board",               category: "depart",  mode: "sea",  color: "#0e7490", resp: ["S","S","S","S","S","S","B","B","B","B","B","B"] },
  // Ventes à l'arrivée
  { code: "CFR", name_fr: "Coût et fret",            name_en: "Cost and Freight",            category: "arrivee", mode: "sea",  color: "#059669", resp: ["S","S","S","S","S","S","S","B","B","B","B","B"] },
  { code: "CIF", name_fr: "Coût, assurance et fret", name_en: "Cost, Insurance & Freight",   category: "arrivee", mode: "sea",  color: "#0d9488", resp: ["S","S","S","S","S","S","S","S","B","B","B","B"] },
  { code: "CPT", name_fr: "Port payé jusqu'à",       name_en: "Carriage Paid To",            category: "arrivee", mode: "all",  color: "#7c3aed", resp: ["S","S","S","S","S","S","S","B","B","B","B","B"] },
  { code: "CIP", name_fr: "Port payé, assurance comprise jusqu'à", name_en: "Carriage & Insurance Paid To", category: "arrivee", mode: "all", color: "#6d28d9", resp: ["S","S","S","S","S","S","S","S","B","B","B","B"] },
  { code: "DAP", name_fr: "Rendu au lieu de destination", name_en: "Delivered at Place",    category: "arrivee", mode: "all",  color: "#15803d", resp: ["S","S","S","S","S","S","S","O","S","S","B","B"] },
  { code: "DPU", name_fr: "Rendu au lieu déchargé", name_en: "Delivered at Place Unloaded",  category: "arrivee", mode: "all",  color: "#166534", resp: ["S","S","S","S","S","S","S","O","S","S","S","B"] },
  { code: "DDP", name_fr: "Rendu droits acquittés",  name_en: "Delivered Duty Paid",         category: "arrivee", mode: "all",  color: "#7e22ce", resp: ["S","S","S","S","S","S","S","O","S","S","B","S"] },
];

const RESP_COLOR: Record<Resp, string> = {
  S: "bg-[#1a2e4a] text-white",
  B: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
  N: "bg-slate-100 dark:bg-slate-700 text-slate-400",
  O: "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300",
};
const RESP_LABEL: Record<Resp, { en: string; fr: string }> = {
  S: { en: "Seller", fr: "Vendeur" },
  B: { en: "Buyer", fr: "Acheteur" },
  N: { en: "—", fr: "—" },
  O: { en: "Optional", fr: "Optionnel" },
};

// ─── Wizard tab ────────────────────────────────────────────────────────────
function WizardTab({ lang }: { lang: Lang }) {
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (newAnswers.length === QUESTIONS.length) {
      setResult(getRecommendation(newAnswers));
    } else {
      setCurrentQ(c => c + 1);
    }
  };

  const reset = () => { setCurrentQ(0); setAnswers([]); setResult(null); };
  const incoterm = result ? INCOTERMS_MAP[result] : null;
  const progress = result ? 100 : (currentQ / QUESTIONS.length) * 100;

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>{L("Progress", "Progression")}</span>
          <span>{result ? L("Complete!", "Terminé !") : `${L("Question", "Question")} ${currentQ + 1} / ${QUESTIONS.length}`}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {QUESTIONS.map((q, i) => (
            <div key={q.id} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < answers.length ? "bg-green-500 text-white"
                  : i === currentQ && !result ? "bg-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-700"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400"
              }`}>
                {i < answers.length ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < QUESTIONS.length - 1 && (
                <div className={`flex-1 h-0.5 w-12 sm:w-24 ${i < answers.length ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </div>
          ))}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${result ? "bg-purple-600 text-white ring-2 ring-purple-300" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
            {result ? "✓" : "→"}
          </div>
        </div>
      </div>

      {/* Question card */}
      {!result && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a2e4a] to-purple-800 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-1">
              {L(`Question ${currentQ + 1} of ${QUESTIONS.length}`, `Question ${currentQ + 1} sur ${QUESTIONS.length}`)}
            </p>
            <h2 className="text-xl font-bold">{L(QUESTIONS[currentQ].q_en, QUESTIONS[currentQ].q_fr)}</h2>
            <p className="text-purple-200 text-sm mt-1">{L(QUESTIONS[currentQ].hint_en, QUESTIONS[currentQ].hint_fr)}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUESTIONS[currentQ].options.map((opt) => (
                <button key={opt.value} onClick={() => handleAnswer(opt.value)}
                  className="flex items-center gap-4 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group text-left">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{L(opt.label_en, opt.label_fr)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{L("Click to select", "Cliquez pour sélectionner")}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-400 ml-auto transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && incoterm && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a2e4a] to-purple-800 px-6 py-5 text-white flex items-center gap-5">
              <div className={`w-20 h-20 ${incoterm.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <span className="text-white font-black text-2xl">{incoterm.code}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-1">{L("Recommended Incoterm", "Incoterm recommandé")}</p>
                <h2 className="text-2xl font-black">{incoterm.code}</h2>
                <p className="text-purple-200 font-medium">{L(incoterm.name_en, incoterm.name_fr)}</p>
                <p className="text-purple-300 text-xs mt-1">{L(incoterm.mode_en, incoterm.mode_fr)}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{L(incoterm.desc_en, incoterm.desc_fr)}</p>
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <span className="text-lg">⚠️</span>
                <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                  <strong>{L("Risk transfers:", "Transfert de risque :")}</strong>{" "}{L(incoterm.risk_transfer_en, incoterm.risk_transfer_fr)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-slate-300">{L("Responsibilities breakdown", "Répartition des responsabilités")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">{L("Operation", "Opération")}</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">🏭 {L("Seller", "Vendeur")}</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">🏢 {L("Buyer", "Acheteur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {incoterm.responsibilities.map((row, i) => (
                    <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-700/20"}`}>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium">{L(row.item_en, row.item_fr)}</td>
                      <td className="text-center px-4 py-3">
                        {row.seller ? <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                          : <span className="text-slate-300 dark:text-slate-600 text-lg">—</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {row.buyer ? <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full"><CheckCircle className="w-4 h-4 text-blue-500" /></span>
                          : <span className="text-slate-300 dark:text-slate-600 text-lg">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Answers summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">{L("Your answers", "Vos réponses")}</h3>
            <div className="space-y-3">
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{L(q.q_en, q.q_fr)}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {L(q.options.find(o => o.value === answers[i])?.label_en ?? "", q.options.find(o => o.value === answers[i])?.label_fr ?? "")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">
            <RotateCcw className="w-4 h-4" /> {L("Start again", "Recommencer")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Full Reference Tab ────────────────────────────────────────────────────
function ReferenceTab({ lang }: { lang: Lang }) {
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;
  const [filter, setFilter] = useState<"all" | "depart" | "arrivee">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === "all" ? ALL_INCOTERMS : ALL_INCOTERMS.filter(i => i.category === filter);
  const depart = ALL_INCOTERMS.filter(i => i.category === "depart");
  const arrivee = ALL_INCOTERMS.filter(i => i.category === "arrivee");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2e4a] to-purple-900 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black mb-1">{L("Établissez votre plan d'approvisionnement", "Établissez votre plan d'approvisionnement")}</h2>
        <p className="text-blue-200 text-sm">{L("Complete Incoterms 2020 reference — all 11 trade terms explained", "Référence complète Incoterms 2020 — les 11 termes commerciaux expliqués")}</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-sm">
            <span className="font-bold text-yellow-300">4</span> {L("Freight Collect terms", "Termes vente au départ")}
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-sm">
            <span className="font-bold text-green-300">7</span> {L("Freight Prepaid terms", "Termes vente à l'arrivée")}
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">{L("Freight Collect", "Ventes au départ")}</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{L("Buyer organises & pays main freight", "L'acheteur organise et paie le fret principal")}</p>
          <div className="flex gap-2 flex-wrap">
            {depart.map(t => (
              <button key={t.code} onClick={() => setSelected(selected === t.code ? null : t.code)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: t.color }}>{t.code}</button>
            ))}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="font-bold text-green-700 dark:text-green-300 text-sm">{L("Freight Prepaid", "Ventes à l'arrivée")}</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mb-3">{L("Seller organises & pays main freight", "Le vendeur organise et paie le fret principal")}</p>
          <div className="flex gap-2 flex-wrap">
            {arrivee.map(t => (
              <button key={t.code} onClick={() => setSelected(selected === t.code ? null : t.code)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: t.color }}>{t.code}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected detail card */}
      {selected && (() => {
        const term = ALL_INCOTERMS.find(t => t.code === selected)!;
        const mapResult = INCOTERMS_MAP[selected];
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 shadow-sm overflow-hidden animate-pulse-once" style={{ borderColor: term.color }}>
            <div className="px-6 py-4 text-white flex items-center gap-4" style={{ background: term.color }}>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="font-black text-xl">{term.code}</span>
              </div>
              <div>
                <p className="font-black text-lg">{term.code}</p>
                <p className="text-white/90 font-medium">{term.name_fr}</p>
                <p className="text-white/70 text-xs">{term.name_en} · {term.mode === "sea" ? L("🚢 Maritime only", "🚢 Maritime uniquement") : L("🚚 All modes", "🚚 Tous modes")}</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-white/70 hover:text-white text-2xl leading-none">×</button>
            </div>
            {mapResult && (
              <div className="p-5">
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{L(mapResult.desc_en, mapResult.desc_fr)}</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ <strong>{L("Risk transfers:", "Transfert de risque :")}</strong> {L(mapResult.risk_transfer_en, mapResult.risk_transfer_fr)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Filter buttons */}
      <div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {([["all", L("All 11 Incoterms", "Les 11 Incoterms")], ["depart", L("Freight Collect (4)", "Vente au départ (4)")], ["arrivee", L("Freight Prepaid (7)", "Vente à l'arrivée (7)")]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === key ? "bg-[#1a2e4a] dark:bg-blue-700 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Definition cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {filtered.map(term => (
            <button key={term.code} onClick={() => setSelected(selected === term.code ? null : term.code)}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${selected === term.code ? "shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
              style={{ borderColor: selected === term.code ? term.color : "transparent", background: selected === term.code ? `${term.color}15` : undefined }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-black text-sm" style={{ backgroundColor: term.color }}>{term.code}</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{term.code}</p>
                  <p className="text-xs" style={{ color: term.color }}>{term.name_fr}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${term.category === "depart" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
                  {term.category === "depart" ? L("Collect", "Départ") : L("Prepaid", "Arrivée")}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{term.name_en}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{term.mode === "sea" ? "🚢 Maritime only" : "🚚 All modes"}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Full comparison matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">
            {L("Complete Responsibilities Matrix — Incoterms 2020", "Tableau complet des responsabilités — Incoterms 2020")}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            <span className="inline-block w-3 h-3 bg-[#1a2e4a] rounded mr-1 align-middle" />{L("Seller", "Vendeur")} &nbsp;
            <span className="inline-block w-3 h-3 bg-amber-200 rounded mr-1 align-middle" />{L("Buyer", "Acheteur")} &nbsp;
            <span className="inline-block w-3 h-3 bg-slate-200 rounded mr-1 align-middle" />{L("Optional", "Optionnel")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "900px" }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 w-48">
                  {L("Operation", "Opération")}
                </th>
                {ALL_INCOTERMS.map(t => (
                  <th key={t.code} className="px-2 py-3 text-center">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto text-white font-black text-xs" style={{ backgroundColor: t.color }}>{t.code}</div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                <td className="px-4 py-1 text-xs text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-700/30"></td>
                {ALL_INCOTERMS.map(t => (
                  <td key={t.code} className="px-2 py-1 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${t.category === "depart" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
                      {t.category === "depart" ? (lang === "en" ? "FC" : "D") : (lang === "en" ? "FP" : "A")}
                    </span>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESP_ROWS_FR.map((rowFr, ri) => (
                <tr key={ri} className={`border-b border-slate-100 dark:border-slate-700 ${ri % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/50"}`}>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800">
                    {lang === "en" ? RESP_ROWS_EN[ri] : rowFr}
                  </td>
                  {ALL_INCOTERMS.map(t => {
                    const resp = t.resp[ri];
                    return (
                      <td key={t.code} className="px-2 py-2.5 text-center">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${RESP_COLOR[resp]}`}>
                          {lang === "en" ? RESP_LABEL[resp].en : (resp === "S" ? "V" : resp === "B" ? "A" : RESP_LABEL[resp].fr)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
          {L("V = Vendor (Seller) · A = Acheteur (Buyer)", "V = Vendeur · A = Acheteur")} · FC = Freight Collect · FP = Freight Prepaid · {L("Source: ICC Incoterms® 2020", "Source : ICC Incoterms® 2020")}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Incoterms() {
  const { lang } = useApp();
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;
  const [pageTab, setPageTab] = useState<PageTab>("wizard");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📋</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">
            {L("Incoterms Assistant", "Assistant Incoterms")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {L("Find your Incoterm with the wizard, or explore the full Incoterms 2020 reference.", "Trouvez votre Incoterm avec l'assistant, ou explorez la référence complète Incoterms 2020.")}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setPageTab("wizard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${pageTab === "wizard" ? "bg-purple-700 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>
          <Zap className="w-4 h-4" /> {L("Smart Wizard", "Assistant intelligent")}
        </button>
        <button onClick={() => setPageTab("reference")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${pageTab === "reference" ? "bg-[#1a2e4a] dark:bg-blue-700 text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>
          <BookOpen className="w-4 h-4" /> {L("Full Reference — All 11", "Référence complète — 11 Incoterms")}
        </button>
      </div>

      {pageTab === "wizard" ? <WizardTab lang={lang} /> : <ReferenceTab lang={lang} />}
    </div>
  );
}
