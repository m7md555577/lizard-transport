import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Truck, HelpCircle, FileText, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import type { Lang } from "@/context/AppContext";
import { BAC_PRO_KB, findBacProKnowledge, getBacProCalculation } from "@/lib/bacProKnowledge";

// ═══════════════════════════════════════════════════════════════════════════
// FUTURE-READY AI PROVIDER HOOK
// Set VITE_AI_PROVIDER_URL in .env to connect a real AI model.
// Falls back to the knowledge base when not configured.
// ═══════════════════════════════════════════════════════════════════════════
async function callAI(message: string, lang: Lang): Promise<string | null> {
  const url = import.meta.env.VITE_AI_PROVIDER_URL as string | undefined;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, lang, context: "lazard-transport-logistics" }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { reply?: string };
    return data.reply ?? null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE AUTO-DETECTION
// ═══════════════════════════════════════════════════════════════════════════
function detectLang(text: string, current: Lang): Lang {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  const lower = text.toLowerCase();
  const frWords = ["bonjour","salut","merci","comment","qu'est","est-ce","c'est","quoi","je veux","vous","nous","les","des","du","une","palette","camion","devis","chauffeur","livraison","combien","quel","quelle","fret","poids","volume","calculer","douane"];
  if (frWords.filter(w => lower.includes(w)).length >= 2) return "fr";
  return current;
}

// ═══════════════════════════════════════════════════════════════════════════
// RANDOM GREETINGS POOL
// ═══════════════════════════════════════════════════════════════════════════
const GREETINGS: Record<Lang, string[]> = {
  en: [
    "👋 Hello! I'm **billemax**, your Lazard Transport assistant.",
    "✌️ Hi there! **billemax** here, ready to help.",
    "🚛 Welcome aboard! I'm **billemax** from Lazard Transport.",
    "👋 Good to see you! **billemax** at your service.",
    "🌍 Hey! I'm **billemax**, your EU logistics expert.",
  ],
  fr: [
    "👋 Bonjour ! Je suis **billemax**, votre assistant Lazard Transport.",
    "🚛 On y va ! Je suis **billemax**, prêt à vous aider.",
    "✌️ Salut ! **billemax** à votre service.",
    "🌍 Bienvenue ! Moi c'est **billemax**, votre assistant Bac Pro Transport.",
    "👋 Bonjour à vous ! Je suis **billemax** de Lazard Transport.",
  ],
  ar: [
    "👋 مرحباً! أنا **billemax**، مساعدك في لازار للنقل.",
    "🚛 أهلاً وسهلاً! **billemax** في خدمتك.",
    "✌️ يلا نبدأ! أنا **billemax** خبير اللوجستيك.",
    "🌍 مرحباً بك! أنا **billemax** من لازار للنقل.",
    "👋 سعيد بلقائك! أنا **billemax**، مساعدك اللوجستي.",
  ],
};

const WELCOMES: Record<Lang, string> = {
  en: "\n\nI can help you with:\n• 💰 Prices & quotes · 📍 Tracking\n• 🚛 Driver regulations · 📦 Pallets\n• 📋 Incoterms 2020 · 📄 Documents\n• 🔧 Logistics calculators · ❓ Quiz mode\n\nType a question or use the quick actions!",
  fr: "\n\nJe peux vous aider avec les bases du Bac Pro Transport :\n• Fret maritime, aérien et routier\n• UP, volume, poids taxable, BAF, CAF et fret total\n• Incoterms, CMR, BL, AWB et documents\n• Douane, TVA, EORI et codes douaniers\n\nPour un calcul, envoyez les données et la formule de votre exercice.",
  ar: "\n\nيمكنني مساعدتك في:\n• 💰 الأسعار والعروض · 📍 تتبع الشحنات\n• 🚛 لوائح السائقين · 📦 المنصات\n• 📋 إنكوترمز 2020 · 📄 الوثائق\n• 🔧 الحاسبات · ❓ وضع الاختبار\n\nاكتب سؤالاً أو استخدم الأزرار السريعة!",
};

function randomGreeting(lang: Lang): string {
  const pool = GREETINGS[lang];
  return pool[Math.floor(Math.random() * pool.length)] + WELCOMES[lang];
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface SuggestItem {
  label_en: string;
  label_fr: string;
  label_ar?: string;
  query: string;
}

interface NavAction {
  label_en: string;
  label_fr: string;
  label_ar?: string;
  path: string;
  emoji: string;
}

interface KBEntry {
  keywords_en: string[];
  keywords_fr: string[];
  answer_en: string;
  answer_fr: string;
  answer_ar?: string;
  suggests?: SuggestItem[];
}

interface QuizQuestion {
  q_en: string;
  q_fr: string;
  options_en: string[];
  options_fr: string[];
  correct: number;
  explain_en: string;
  explain_fr: string;
}

interface DocStep {
  q_en: string;
  q_fr: string;
  yes_en: string;
  yes_fr: string;
  no_en: string;
  no_fr: string;
  yes_next: number | "result";
  no_next: number | "result";
  yes_docs?: string[];
  no_docs?: string[];
}

interface Message {
  role: "bot" | "user";
  text: string;
  id: number;
  suggests?: SuggestItem[];
  quizOptions?: { en: string[]; fr: string[] };
  docOptions?: boolean;
  isResult?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════
const NAV_ACTIONS: NavAction[] = [
  { emoji: "💰", label_en: "Calculate Price",     label_fr: "Calculer un devis",    label_ar: "حساب السعر",       path: "/calculator" },
  { emoji: "📍", label_en: "Track Shipment",      label_fr: "Suivre un envoi",      label_ar: "تتبع الشحنة",      path: "/tracking"   },
  { emoji: "📋", label_en: "Incoterms",           label_fr: "Incoterms",            label_ar: "إنكوترمز",         path: "/incoterms"  },
  { emoji: "🚛", label_en: "Driver Rules",        label_fr: "Règles chauffeur",     label_ar: "قواعد السائق",     path: "/driver"     },
  { emoji: "📄", label_en: "Documents",           label_fr: "Documents",            label_ar: "الوثائق",          path: "/documents"  },
  { emoji: "🔧", label_en: "Logistics Tools",     label_fr: "Outils logistiques",   label_ar: "أدوات لوجستية",   path: "/tools"      },
  { emoji: "📏", label_en: "Distance Calculator", label_fr: "Calculateur distance", label_ar: "حساب المسافة",    path: "/distance"   },
  { emoji: "📞", label_en: "Contact",             label_fr: "Contact",              label_ar: "اتصل بنا",         path: "/contact"    },
];

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ QUESTIONS DATABASE
// ═══════════════════════════════════════════════════════════════════════════
const LEGACY_QUIZ: QuizQuestion[] = [
  {
    q_en: "🚛 What is the maximum **continuous driving time** under EU Reg. 561/2006?",
    q_fr: "🚛 Quelle est la durée maximale de **conduite continue** selon le règl. UE 561/2006 ?",
    options_en: ["3 hours", "4 hours 30 min", "5 hours", "6 hours"],
    options_fr: ["3 heures", "4 heures 30 min", "5 heures", "6 heures"],
    correct: 1,
    explain_en: "✅ Correct! Maximum continuous driving is **4h30**. After that, a **45-minute break** is mandatory (can be split: 15 + 30 min).",
    explain_fr: "✅ Correct ! La conduite continue max est **4h30**. Une pause de **45 min** est alors obligatoire (peut être fractionnée : 15 + 30 min).",
  },
  {
    q_en: "📦 How many **EUR pallets** fit in a standard semi-trailer (13.6m)?",
    q_fr: "📦 Combien de **palettes EUR** rentrent dans une semi-remorque standard (13,6m) ?",
    options_en: ["24 pallets", "28 pallets", "33 pallets", "40 pallets"],
    options_fr: ["24 palettes", "28 palettes", "33 palettes", "40 palettes"],
    correct: 2,
    explain_en: "✅ Correct! A standard 13.6m trailer fits **33 EUR pallets** (120×80cm). Floor dimensions: 13.6m × 2.4m.",
    explain_fr: "✅ Correct ! Une remorque standard de 13,6m contient **33 palettes EUR** (120×80cm). Dimensions : 13,6m × 2,4m.",
  },
  {
    q_en: "📋 Which Incoterm gives the **buyer maximum obligation** (buyer does everything)?",
    q_fr: "📋 Quel Incoterm donne **le maximum d'obligations à l'acheteur** ?",
    options_en: ["DDP", "DAP", "EXW", "FCA"],
    options_fr: ["DDP", "DAP", "EXW", "FCA"],
    correct: 2,
    explain_en: "✅ Correct! **EXW (Ex Works)** — the seller only makes goods available at their premises. The buyer handles everything: loading, export customs, freight, import customs.",
    explain_fr: "✅ Correct ! **EXW (À l'usine)** — le vendeur met seulement les marchandises à disposition dans ses locaux. L'acheteur gère tout : chargement, douane export, fret, douane import.",
  },
  {
    q_en: "📐 What is the standard **EUR pallet size**?",
    q_fr: "📐 Quelle est la taille standard d'une **palette EUR** ?",
    options_en: ["100 × 80 cm", "120 × 80 cm", "120 × 100 cm", "140 × 80 cm"],
    options_fr: ["100 × 80 cm", "120 × 80 cm", "120 × 100 cm", "140 × 80 cm"],
    correct: 1,
    explain_en: "✅ Correct! The **EUR/EPAL pallet** is **120 × 80 cm**, max load 1,500 kg static, 1,000 kg dynamic.",
    explain_fr: "✅ Correct ! La **palette EUR/EPAL** mesure **120 × 80 cm**, charge max 1 500 kg statique, 1 000 kg dynamique.",
  },
  {
    q_en: "🚢 Which Incoterms are **maritime only** (cannot be used for road transport)?",
    q_fr: "🚢 Quels Incoterms sont **maritime uniquement** (ne s'utilisent pas pour le transport routier) ?",
    options_en: ["EXW and DDP", "FCA and DAP", "FOB and CIF", "CPT and CIP"],
    options_fr: ["EXW et DDP", "FCA et DAP", "FOB et CIF", "CPT et CIP"],
    correct: 2,
    explain_en: "✅ Correct! **FOB** and **CIF** are for maritime transport only. For road freight, use **FCA** (instead of FOB) and **CIP** (instead of CIF).",
    explain_fr: "✅ Correct ! **FOB** et **CIF** sont uniquement pour le maritime. Pour la route, utilisez **FCA** (au lieu de FOB) et **CIP** (au lieu de CIF).",
  },
  {
    q_en: "📜 What is the **CMR** in road transport?",
    q_fr: "📜 Qu'est-ce que le **CMR** dans le transport routier ?",
    options_en: ["A truck model", "International consignment note", "A customs form", "A driver licence type"],
    options_fr: ["Un modèle de camion", "Lettre de voiture internationale", "Un formulaire douanier", "Un type de permis de conduire"],
    correct: 1,
    explain_en: "✅ Correct! The **CMR** is the International Consignment Note for road freight, based on the Geneva Convention (1956). Mandatory for cross-border transport in 55+ countries.",
    explain_fr: "✅ Correct ! Le **CMR** est la lettre de voiture internationale pour le transport routier, basée sur la Convention de Genève (1956). Obligatoire pour le transfrontalier dans 55+ pays.",
  },
  {
    q_en: "⚖️ What is the **maximum GVW** for a standard articulated truck (semi) in the EU?",
    q_fr: "⚖️ Quel est le **PTAC maximum** d'un camion articulé (semi) en UE ?",
    options_en: ["32 tonnes", "36 tonnes", "40 tonnes", "44 tonnes"],
    options_fr: ["32 tonnes", "36 tonnes", "40 tonnes", "44 tonnes"],
    correct: 2,
    explain_en: "✅ Correct! **40 tonnes GVW** for a standard articulated truck. It can be up to **44t** when carrying an ISO container on combined transport.",
    explain_fr: "✅ Correct ! **40 tonnes PTAC** pour un camion articulé standard. Il peut aller jusqu'à **44t** lors du transport combiné avec conteneur ISO.",
  },
  {
    q_en: "⏰ What is the **minimum weekly rest** for EU truck drivers?",
    q_fr: "⏰ Quel est le **repos hebdomadaire minimum** pour les chauffeurs poids lourds UE ?",
    options_en: ["24 hours", "36 hours", "45 hours", "56 hours"],
    options_fr: ["24 heures", "36 heures", "45 heures", "56 heures"],
    correct: 2,
    explain_en: "✅ Correct! Minimum weekly rest is **45 hours**. It can be reduced to 24h maximum twice per 4-week period, but the reduction must be compensated within 3 weeks.",
    explain_fr: "✅ Correct ! Le repos hebdomadaire minimum est **45 heures**. Il peut être réduit à 24h max 2 fois par période de 4 semaines, mais la réduction doit être compensée dans les 3 semaines.",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    q_en: "What does **BAF** mean in maritime transport?",
    q_fr: "Que signifie **BAF** dans le transport maritime ?",
    options_en: ["A port document", "A fuel-related surcharge", "A container type", "An air freight document"],
    options_fr: ["Un document portuaire", "Un supplément lié au carburant", "Un type de conteneur", "Un document aérien"],
    correct: 1,
    explain_en: "Correct! BAF means Bunker Adjustment Factor. It is linked to the ship's fuel cost.",
    explain_fr: "Correct ! Le BAF est un supplément lié au prix du carburant du navire.",
  },
  {
    q_en: "What is **1 EVP / TEU**?",
    q_fr: "À quoi correspond **1 EVP / TEU** ?",
    options_en: ["A 20-foot container", "A 40-foot container", "A pallet", "A truck"],
    options_fr: ["Un conteneur de 20 pieds", "Un conteneur de 40 pieds", "Une palette", "Un camion"],
    correct: 0,
    explain_en: "Correct! One 20-foot container equals 1 EVP. A 40-foot container is generally 2 EVP.",
    explain_fr: "Correct ! Un conteneur de 20 pieds vaut 1 EVP. Un conteneur de 40 pieds vaut généralement 2 EVP.",
  },
  {
    q_en: "How do you calculate air cargo volume?",
    q_fr: "Comment calcule-t-on le volume en fret aérien ?",
    options_en: ["Length × width × height", "Weight × price", "Distance ÷ time", "PTAC − empty weight"],
    options_fr: ["Longueur × largeur × hauteur", "Poids × prix", "Distance ÷ temps", "PTAC − poids à vide"],
    correct: 0,
    explain_en: "Correct! Volume = length × width × height, with the same unit for all dimensions.",
    explain_fr: "Correct ! Volume = longueur × largeur × hauteur, avec la même unité pour toutes les dimensions.",
  },
  {
    q_en: "What is the **taxable weight** in air freight?",
    q_fr: "Qu'est-ce que le **poids taxable** en fret aérien ?",
    options_en: ["Always the real weight", "The weight used for the tariff, following the exercise rule", "The vehicle PTAC", "The net weight only"],
    options_fr: ["Toujours le poids réel", "Le poids utilisé pour le tarif selon la règle de l'exercice", "Le PTAC du véhicule", "Seulement le poids net"],
    correct: 1,
    explain_en: "Correct! Compare real and volumetric weight according to the rule given in the exercise.",
    explain_fr: "Correct ! On compare le poids réel et le poids volumétrique selon la règle donnée dans l'exercice.",
  },
  {
    q_en: "What is a **CMR**?",
    q_fr: "Qu'est-ce qu'une **CMR** ?",
    options_en: ["A road consignment note", "A maritime container", "An airport fee", "A customs tax"],
    options_fr: ["Une lettre de voiture routière", "Un conteneur maritime", "Un frais d'aéroport", "Une taxe douanière"],
    correct: 0,
    explain_en: "Correct! The CMR is the road transport consignment note.",
    explain_fr: "Correct ! La CMR est la lettre de voiture du transport routier.",
  },
  {
    q_en: "Which document is used for maritime transport?",
    q_fr: "Quel document est utilisé pour le transport maritime ?",
    options_en: ["AWB", "BL / Bill of Lading", "CMR only", "EORI"],
    options_fr: ["AWB", "BL / connaissement maritime", "Seulement la CMR", "EORI"],
    correct: 1,
    explain_en: "Correct! The BL is the maritime transport document. AWB is used for air freight.",
    explain_fr: "Correct ! Le BL est le document du transport maritime. L'AWB est utilisé pour le fret aérien.",
  },
  {
    q_en: "Which Incoterm gives the seller the greatest responsibility?",
    q_fr: "Quel Incoterm donne la plus grande responsabilité au vendeur ?",
    options_en: ["EXW", "FCA", "DAP", "DDP"],
    options_fr: ["EXW", "FCA", "DAP", "DDP"],
    correct: 3,
    explain_en: "Correct! With DDP, the seller takes care of transport and the agreed import responsibilities.",
    explain_fr: "Correct ! Avec DDP, le vendeur prend en charge le transport et les responsabilités d'import prévues.",
  },
  {
    q_en: "What is the **charge utile**?",
    q_fr: "Qu'est-ce que la **charge utile** ?",
    options_en: ["The maximum goods weight the vehicle can carry", "The empty vehicle weight", "The road distance", "The toll price"],
    options_fr: ["Le poids maximum de marchandises transportables", "Le poids à vide", "La distance routière", "Le prix du péage"],
    correct: 0,
    explain_en: "Correct! Charge utile is the goods payload. A common formula is PTAC − empty weight.",
    explain_fr: "Correct ! La charge utile est le poids de marchandises transportables. Une formule fréquente est PTAC − poids à vide.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT ASSISTANT FLOW
// ═══════════════════════════════════════════════════════════════════════════
const LEGACY_DOC_FLOW: DocStep[] = [
  // Step 0
  {
    q_en: "📄 **Document Assistant** — Let's find the right documents for your shipment.\n\nIs this an **international shipment** (crossing a border)?",
    q_fr: "📄 **Assistant documentaire** — Trouvons les bons documents pour votre envoi.\n\nS'agit-il d'un **envoi international** (franchissement de frontière) ?",
    yes_en: "Yes, international", no_en: "No, domestic (France only)",
    yes_fr: "Oui, international", no_fr: "Non, national (France uniquement)",
    yes_next: 1, no_next: "result",
    no_docs: ["Commercial invoice / Bon de livraison", "Packing list", "Driver's licence", "Vehicle registration (carte grise)"],
  },
  // Step 1
  {
    q_en: "Is the destination **within the EU** (single market)?",
    q_fr: "La destination est-elle **dans l'UE** (marché unique) ?",
    yes_en: "Yes, EU country", no_en: "No, outside EU (UK, CH, TR…)",
    yes_fr: "Oui, pays UE", no_fr: "Non, hors UE (UK, CH, TR…)",
    yes_next: 2, no_next: "result",
    no_docs: ["CMR consignment note ⭐ MANDATORY", "Commercial invoice", "Packing list", "Export customs declaration (DAU/SAD)", "EUR 1 certificate (if applicable)", "EORI number", "Driver CPC certificate", "Community licence"],
  },
  // Step 2
  {
    q_en: "Are you carrying **high-value or fragile goods** (electronics, pharmaceuticals, fine art)?",
    q_fr: "Transportez-vous des **marchandises de valeur ou fragiles** (électronique, pharma, art) ?",
    yes_en: "Yes, sensitive goods", no_en: "No, standard goods",
    yes_fr: "Oui, marchandises sensibles", no_fr: "Non, marchandises standard",
    yes_next: "result", no_next: "result",
    yes_docs: ["CMR consignment note ⭐ MANDATORY", "Commercial invoice", "Packing list", "All-risks cargo insurance certificate", "Driver CPC certificate", "Community licence", "Tachograph records"],
    no_docs: ["CMR consignment note ⭐ MANDATORY", "Commercial invoice", "Packing list", "Driver CPC certificate", "Community licence", "Tachograph records"],
  },
];

const DOC_FLOW: DocStep[] = [
  {
    q_en: "Document Assistant — Is this an international shipment crossing a border?",
    q_fr: "Assistant documentaire — Votre envoi traverse-t-il une frontière ?",
    yes_en: "Yes, international", no_en: "No, France only",
    yes_fr: "Oui, international", no_fr: "Non, France uniquement",
    yes_next: 1, no_next: "result",
    no_docs: ["CMR / lettre de voiture", "Facture commerciale", "Packing list / liste de colisage"],
  },
  {
    q_en: "Is a customs document required for this shipment?",
    q_fr: "Un document douanier est-il nécessaire pour cet envoi ?",
    yes_en: "Yes, customs involved", no_en: "No customs document",
    yes_fr: "Oui, passage en douane", no_fr: "Non, pas de document douanier",
    yes_next: "result", no_next: "result",
    yes_docs: ["CMR / lettre de voiture", "Facture commerciale", "Packing list / liste de colisage", "Document douanier"],
    no_docs: ["CMR / lettre de voiture", "Facture commerciale", "Packing list / liste de colisage"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════
const KB: KBEntry[] = [
  {
    keywords_en: ["hello","hi","hey","good morning","greet","start","help","what can"],
    keywords_fr: ["bonjour","salut","coucou","bonsoir","aide","comment","qu'est-ce"],
    answer_en: "👋 Hello! I'm **billemax**, your logistics assistant.\n\nAsk me about pricing, tracking, Incoterms, driver rules, pallets, documents, or type **quiz** to test your logistics knowledge!",
    answer_fr: "👋 Bonjour ! Je suis **billemax**, votre assistant logistique.\n\nPosez-moi des questions sur les tarifs, le suivi, les Incoterms, les règles chauffeur, les palettes, les documents, ou tapez **quiz** pour tester vos connaissances !",
    suggests: [
      { label_en: "💰 Prices", label_fr: "💰 Tarifs", label_ar: "💰 الأسعار", query: "price cost rate" },
      { label_en: "📍 Track", label_fr: "📍 Suivi", label_ar: "📍 تتبع", query: "track shipment" },
      { label_en: "❓ Quiz", label_fr: "❓ Quiz", label_ar: "❓ اختبار", query: "quiz" },
    ],
  },
  {
    keywords_en: ["price","cost","rate","how much","charge","fee","tariff","pricing","quote","estimate"],
    keywords_fr: ["prix","coût","tarif","combien","frais","tarification","devis","estimation"],
    answer_en: "📊 **Our transport rates:**\n• Base rate: **1.20 €/km**\n• Pallet surcharge: **5.00 €/pallet**\n• Fuel surcharge: ~28–36 L/100km (truck)\n• Tolls: 0.12–0.22 €/km depending on vehicle\n\n**Formula:** (distance × 1.20) + (pallets × 5.00)\n\n💡 Use the **Cost Simulator** for a full breakdown!",
    answer_fr: "📊 **Nos tarifs de transport :**\n• Tarif de base : **1,20 €/km**\n• Supplément palette : **5,00 €/palette**\n• Surcharge carburant : ~28–36 L/100km (camion)\n• Péages : 0,12–0,22 €/km selon le véhicule\n\n**Formule :** (distance × 1,20) + (palettes × 5,00)\n\n💡 Utilisez le **Simulateur de coût** pour le détail complet !",
    suggests: [
      { label_en: "📏 Calc distance", label_fr: "📏 Calculer km", query: "distance km" },
      { label_en: "📦 Pallet specs", label_fr: "📦 Palettes", query: "pallet eur size" },
      { label_en: "⛽ Fuel cost", label_fr: "⛽ Carburant", query: "fuel consumption diesel" },
    ],
  },
  {
    keywords_en: ["delivery","time","long","duration","when","arrive","days","hours","fast","deadline"],
    keywords_fr: ["livraison","délai","temps","combien de temps","arriver","jours","heures","rapide"],
    answer_en: "⏱️ **Estimated delivery times:**\n• Within France: **1–2 business days**\n• Neighbouring EU (BE, DE, ES, IT): **2–3 days**\n• EU cross-border (PL, RO, PT): **3–5 days**\n• UK (post-Brexit + customs): **4–6 days**\n\n⚠️ Times depend on route, traffic, and customs clearance.",
    answer_fr: "⏱️ **Délais de livraison estimés :**\n• En France : **1–2 jours ouvrés**\n• UE limitrophe (BE, DE, ES, IT) : **2–3 jours**\n• UE transfrontalier (PL, RO, PT) : **3–5 jours**\n• Royaume-Uni (Brexit + douanes) : **4–6 jours**",
    suggests: [
      { label_en: "📍 Track shipment", label_fr: "📍 Suivre envoi", query: "track shipment" },
      { label_en: "🌍 International", label_fr: "🌍 International", query: "international transport europe" },
    ],
  },
  {
    keywords_en: ["track","tracking","shipment","where","package","status","locate","find","number","follow"],
    keywords_fr: ["suivi","suivre","expédition","où","colis","statut","localiser","numéro","tracer"],
    answer_en: "📍 **Track your shipment:**\n1. Click **Tracking** in the navigation\n2. Enter your tracking number (e.g. LT2025001)\n3. Watch the **live animated map**!\n\nDemo numbers: **LT2025001** to **LT2025005**",
    answer_fr: "📍 **Suivre votre expédition :**\n1. Cliquez sur **Suivi** dans la navigation\n2. Entrez votre numéro de suivi (ex. LT2025001)\n3. Regardez la **carte animée en direct** !\n\nNuméros de démo : **LT2025001** à **LT2025005**",
    suggests: [
      { label_en: "💰 Estimate cost", label_fr: "💰 Estimer coût", query: "price cost rate" },
      { label_en: "📄 CMR doc", label_fr: "📄 Document CMR", query: "cmr document" },
    ],
  },
  {
    keywords_en: ["driver","break","rest","regulation","eu","rules","hours","continuous","driving","561","tachograph"],
    keywords_fr: ["chauffeur","pause","repos","réglementation","ue","règles","heures","conduite","561","tachygraphe"],
    answer_en: "🚛 **EU Driving Regulations (Reg. 561/2006):**\n\n**Daily limits:**\n• Max **4h30** continuous driving → mandatory **45 min break**\n• Max **9h/day** (10h twice per week)\n• Min **11h daily rest** (9h reduced twice/week)\n\n**Weekly:**\n• Max **56h** per week / **90h** per 2 weeks\n• Min **45h** weekly rest\n\n🚛 Use the **Driver Panel** for a full schedule!",
    answer_fr: "🚛 **Réglementation UE conduite (Rég. 561/2006) :**\n\n**Limites journalières :**\n• Max **4h30** de conduite continue → pause **45 min** obligatoire\n• Max **9h/jour** (10h 2×/semaine)\n• Repos journalier min **11h** (réduit 2×/semaine)\n\n**Hebdomadaires :**\n• Max **56h**/semaine · **90h**/2 semaines\n• Repos hebdo min **45h**\n\n🚛 Utilisez le **Panneau Chauffeur** !",
    suggests: [
      { label_en: "📟 Tachograph", label_fr: "📟 Tachygraphe", query: "tachograph digital card" },
      { label_en: "❓ Quiz me!", label_fr: "❓ Testez-moi !", query: "quiz" },
    ],
  },
  {
    keywords_en: ["tachograph","tacho","digital","record","card","download","driver card"],
    keywords_fr: ["tachygraphe","chronotachygraphe","numérique","enregistrement","carte chauffeur","téléchargement"],
    answer_en: "📟 **Tachograph rules (EU):**\n• All trucks >3.5t: **digital tachograph** mandatory\n• Driver card download: every **28 days** max\n• Vehicle unit download: every **90 days** max\n• Data kept: **1 year** (driver) / **1 year** (company)\n• Since 2019: **Smart tachograph** (2nd gen) on new vehicles",
    answer_fr: "📟 **Règles tachygraphe (UE) :**\n• Tous camions >3,5t : **tachygraphe numérique** obligatoire\n• Téléchargement carte : tous les **28 jours** max\n• Téléchargement appareil : tous les **90 jours** max\n• Données conservées : **1 an** (chauffeur & entreprise)\n• Depuis 2019 : **tachygraphe intelligent** (2e gen) sur nouveaux véhicules",
    suggests: [
      { label_en: "🚛 Driver rules", label_fr: "🚛 Règles conduite", query: "driver break rest eu regulation" },
      { label_en: "🌍 International", label_fr: "🌍 International", query: "international transport" },
    ],
  },
  {
    keywords_en: ["pallet","eur","size","dimension","weight","load","standard","epal"],
    keywords_fr: ["palette","eur","taille","dimension","poids","charge","standard","epal"],
    answer_en: "📦 **EUR Pallet (EPAL) specs:**\n• Size: **120 × 80 cm**\n• Max static load: **1,500 kg**\n• Max dynamic load: **1,000 kg**\n• Max stacked height: **220 cm** loaded\n• Pallet weight: ~25 kg\n\n**Other types:** UK (120×100), Half (80×60)\n\n📐 Use the **Pallet Calculator** to check truck fit!",
    answer_fr: "📦 **Spécifications palette EUR (EPAL) :**\n• Taille : **120 × 80 cm**\n• Charge statique max : **1 500 kg**\n• Charge dynamique max : **1 000 kg**\n• Hauteur max chargée : **220 cm**\n• Poids palette : ~25 kg\n\n**Autres :** UK (120×100), Demi (80×60)\n\n📐 Utilisez le **Calculateur palettes** !",
    suggests: [
      { label_en: "🚛 Truck capacity", label_fr: "🚛 Capacité camion", query: "truck capacity semi pallets" },
      { label_en: "📐 Volume/LDM", label_fr: "📐 Volume/LDM", query: "volume loading metre ldm" },
    ],
  },
  {
    keywords_en: ["truck","vehicle","capacity","semi","trailer","van","payload","max weight","how many pallets"],
    keywords_fr: ["camion","véhicule","capacité","semi-remorque","camionnette","charge utile","poids max","combien de palettes"],
    answer_en: "🚛 **European truck capacities:**\n\n• **Van (3.5t):** 4 pallets · ~900 kg\n• **Light Truck (7.5t):** 8 pallets · ~4,500 kg\n• **Freight Truck (20t):** 16 pallets · ~12,000 kg\n• **Semi-trailer (24t):** **33 pallets** · ~24,000 kg\n\n📏 Trailer dimensions: **13.6m × 2.4m × 2.7m**",
    answer_fr: "🚛 **Capacités des camions européens :**\n\n• **Camionnette (3,5t) :** 4 palettes · ~900 kg\n• **Porteur léger (7,5t) :** 8 palettes · ~4 500 kg\n• **Camion de fret (20t) :** 16 palettes · ~12 000 kg\n• **Semi-remorque (24t) :** **33 palettes** · ~24 000 kg\n\n📏 Remorque : **13,6m × 2,4m × 2,7m**",
    suggests: [
      { label_en: "📦 Pallet specs", label_fr: "📦 Palettes", query: "pallet eur size dimension" },
      { label_en: "📐 Volume", label_fr: "📐 Volume", query: "volume m3 loading metre" },
      { label_en: "⚖️ Weight limits", label_fr: "⚖️ Limites de poids", query: "weight limit max kg ton" },
    ],
  },
  {
    keywords_en: ["volume","m3","cubic","loading metre","ldm","linear","space"],
    keywords_fr: ["volume","m3","cubique","mètre linéaire","ldm","linéaire","espace"],
    answer_en: "📐 **Volume & Loading Metres:**\n\n**Volume:** L × W × H (metres) = m³\n\n**Loading metres (ldm):** floor area ÷ 2.4m\n• 1 EUR pallet = **0.4 ldm**\n• Full trailer = 33 pallets = **13.2 ldm**\n• 1 m² floor = **0.417 ldm**\n\n💡 Use the **Volume Calculator** in Logistics Tools!",
    answer_fr: "📐 **Volume et mètres linéaires :**\n\n**Volume :** L × l × H (mètres) = m³\n\n**Mètres linéaires (ldm) :** surface au sol ÷ 2,4m\n• 1 palette EUR = **0,4 ldm**\n• Remorque complète = **13,2 ldm**\n• 1 m² = **0,417 ldm**\n\n💡 Utilisez le **Calculateur de volume** !",
    suggests: [
      { label_en: "🚛 Truck capacity", label_fr: "🚛 Capacité camion", query: "truck vehicle capacity semi" },
    ],
  },
  {
    keywords_en: ["weight","limit","max","kg","ton","gross","total weight","axle"],
    keywords_fr: ["poids","limite","max","kg","tonne","brut","poids total","essieu"],
    answer_en: "⚖️ **EU Weight limits:**\n• **Semi (articulated):** 40 t GVW (44t with ISO container)\n• **Rigid truck:** 18 t GVW\n• **Van:** 3.5 t GVW\n• **Max axle load:** 11.5 t\n\n⚠️ Overloading is penalized at roadside inspections!",
    answer_fr: "⚖️ **Limites de poids UE :**\n• **Semi articulé :** 40 t PTAC (44t avec conteneur ISO)\n• **Porteur rigide :** 18 t PTAC\n• **Camionnette :** 3,5 t PTAC\n• **Essieu moteur max :** 11,5 t\n\n⚠️ Surcharges sanctionnées aux contrôles routiers !",
    suggests: [
      { label_en: "🚛 Truck types", label_fr: "🚛 Types de camions", query: "truck vehicle capacity semi" },
    ],
  },
  {
    keywords_en: ["type","mode","road","sea","air","rail","multimodal","combined","intermodal"],
    keywords_fr: ["type","mode","route","mer","air","rail","multimodal","combiné","intermodal"],
    answer_en: "🌍 **Transport modes in Europe:**\n\n• 🚚 **Road (FTL/LTL):** Most common, door-to-door\n• 🚢 **Sea:** Containers, long distances, low cost/kg\n• ✈️ **Air:** Fast, expensive, urgent/high-value goods\n• 🚂 **Rail:** Heavy/bulk, eco-friendly\n• 🔀 **Multimodal:** Combines road + sea/rail\n\nLazard Transport specialises in **EU road freight**.",
    answer_fr: "🌍 **Modes de transport en Europe :**\n\n• 🚚 **Route (FTL/LTL) :** Le plus courant, porte-à-porte\n• 🚢 **Mer :** Conteneurs, longues distances, faible coût/kg\n• ✈️ **Air :** Rapide, coûteux, marchandises urgentes\n• 🚂 **Rail :** Charges lourdes, écologique\n• 🔀 **Multimodal :** Route + mer/rail combinés\n\nLazard Transport se spécialise dans le **fret routier UE**.",
    suggests: [
      { label_en: "📦 FTL vs LTL", label_fr: "📦 FTL vs LTL", query: "ftl ltl full load groupage" },
      { label_en: "🌍 International", label_fr: "🌍 International", query: "international cross border europe" },
    ],
  },
  {
    keywords_en: ["ftl","ltl","full load","groupage","part load","full truck"],
    keywords_fr: ["ftl","ltl","chargement complet","groupage","charge partielle"],
    answer_en: "📦 **FTL vs LTL:**\n\n**FTL (Full Truck Load):**\n• You fill the entire truck\n• Faster, more secure\n• Best for 18+ pallets\n• Direct delivery, no stops\n\n**LTL (Groupage):**\n• Share space with other shippers\n• More economical for small loads\n• Best for 1–10 pallets",
    answer_fr: "📦 **FTL vs LTL :**\n\n**FTL (Chargement complet) :**\n• Vous remplissez tout le camion\n• Plus rapide, plus sécurisé\n• Idéal pour 18+ palettes\n• Livraison directe\n\n**LTL (Groupage) :**\n• Vous partagez l'espace\n• Plus économique pour petits volumes\n• Idéal pour 1–10 palettes",
    suggests: [
      { label_en: "💰 Get quote", label_fr: "💰 Obtenir un devis", query: "price cost rate" },
    ],
  },
  {
    keywords_en: ["document","papers","required","invoice","packing list","certificate","needed","which document","what document"],
    keywords_fr: ["document","papiers","requis","facture","liste de colisage","certificat","nécessaire","quel document"],
    answer_en: "📄 **Common transport documents:**\n\n**Always needed:**\n• Commercial invoice · Packing list\n• Driver licence & CPC card\n• Vehicle registration + insurance\n\n**Cross-border (mandatory):**\n• **CMR** consignment note\n• Tachograph records\n\n**Non-EU shipments:**\n• Export customs declaration · EUR 1 certificate · EORI\n\n💡 Type **document assistant** to find exactly what you need!",
    answer_fr: "📄 **Documents de transport courants :**\n\n**Toujours nécessaires :**\n• Facture commerciale · Liste de colisage\n• Permis + carte CPC chauffeur\n• Carte grise + assurance\n\n**Transfrontalier (obligatoire) :**\n• **CMR** lettre de voiture\n• Enregistrements tachygraphe\n\n**Hors UE :**\n• DAU/SAD · Certificat EUR 1 · EORI\n\n💡 Tapez **assistant documentaire** pour un guide personnalisé !",
    suggests: [
      { label_en: "📜 CMR details", label_fr: "📜 Détails CMR", query: "cmr consignment note waybill" },
      { label_en: "📄 Doc assistant", label_fr: "📄 Assistant docs", query: "document assistant" },
    ],
  },
  {
    keywords_en: ["cmr","consignment note","waybill","international transport","cmr form"],
    keywords_fr: ["cmr","lettre de voiture","transport international","formulaire cmr","convention cmr"],
    answer_en: "📜 **CMR — International Consignment Note:**\n\nBased on the Geneva Convention (19 May 1956).\n\n**Contains:**\n• Sender & receiver details\n• Carrier information\n• Loading & delivery places\n• Goods: description, pallets, weight\n• Driver name & vehicle registration\n• 3 signature fields (sender, carrier, consignee)\n\n⚠️ Mandatory for all international road transport in 55+ countries.\n\n📋 Generate your CMR on the **Documents** page!",
    answer_fr: "📜 **CMR — Lettre de voiture internationale :**\n\nBasée sur la Convention de Genève (19 mai 1956).\n\n**Contient :**\n• Coordonnées expéditeur & destinataire\n• Informations transporteur\n• Lieux chargement & livraison\n• Marchandises : description, palettes, poids\n• Chauffeur & immatriculation\n• 3 espaces de signature\n\n⚠️ Obligatoire dans 55+ pays.\n\n📋 Générez votre CMR sur la page **Documents** !",
    suggests: [
      { label_en: "🛡️ Insurance", label_fr: "🛡️ Assurance", query: "insurance transport cover" },
      { label_en: "📋 Incoterms", label_fr: "📋 Incoterms", query: "incoterm" },
    ],
  },
  {
    keywords_en: ["incoterm","incoterms","trade term","trade","import","export","seller","buyer","risk"],
    keywords_fr: ["incoterm","incoterms","terme commercial","commerce","import","export","vendeur","acheteur","risque"],
    answer_en: "📋 **Incoterms 2020 — Quick overview:**\n\n**Buyer pays main freight:**\n• **EXW** — Ex Works (max buyer obligation)\n• **FCA** — Free Carrier ✅ Best for EU road\n• **FAS / FOB** — Sea only\n\n**Seller pays main freight:**\n• **CFR / CIF** — Sea only\n• **CPT / CIP** — All modes\n• **DAP / DPU / DDP** — DDP = max seller obligation\n\n💡 Go to **Incoterms** page for the full comparison!",
    answer_fr: "📋 **Incoterms 2020 — Vue d'ensemble :**\n\n**Acheteur paie le fret :**\n• **EXW** — À l'usine (max obligation acheteur)\n• **FCA** — Franco transporteur ✅ Idéal route UE\n• **FAS / FOB** — Maritime uniquement\n\n**Vendeur paie le fret :**\n• **CFR / CIF** — Maritime uniquement\n• **CPT / CIP** — Tous modes\n• **DAP / DPU / DDP** — DDP = max obligation vendeur\n\n💡 Consultez la page **Incoterms** pour le détail !",
    suggests: [
      { label_en: "🏭 EXW", label_fr: "🏭 EXW", query: "exw ex works factory" },
      { label_en: "🚚 FCA", label_fr: "🚚 FCA", query: "fca free carrier" },
      { label_en: "🏠 DAP/DDP", label_fr: "🏠 DAP/DDP", query: "dap delivered at place destination" },
    ],
  },
  {
    keywords_en: ["exw","ex works","factory","seller premises"],
    keywords_fr: ["exw","à l'usine","départ usine","locaux vendeur"],
    answer_en: "🏭 **EXW — Ex Works:**\n\n• Seller: goods ready **at their premises only**\n• Buyer: responsible for **ALL** — loading, export customs, main freight, insurance, import customs\n• Risk transfers: **at seller's premises**\n\n⚠️ Often impractical for international trade — consider **FCA** instead.",
    answer_fr: "🏭 **EXW — À l'usine :**\n\n• Vendeur : marchandises disponibles dans **ses locaux uniquement**\n• Acheteur : responsable de **TOUT** — chargement, douane export, fret, assurance, douane import\n• Transfert de risque : **dans les locaux du vendeur**\n\n⚠️ Souvent peu pratique — préférez **FCA** pour l'international.",
    suggests: [
      { label_en: "🚚 FCA instead?", label_fr: "🚚 FCA plutôt ?", query: "fca free carrier" },
      { label_en: "📋 All Incoterms", label_fr: "📋 Tous Incoterms", query: "incoterm incoterms trade" },
    ],
  },
  {
    keywords_en: ["fca","free carrier","carrier"],
    keywords_fr: ["fca","franco transporteur"],
    answer_en: "🚚 **FCA — Free Carrier:**\n\n• Seller: delivers to **named carrier** at specified place, handles export customs\n• Buyer: pays main freight, insurance, import customs\n• Risk transfers: **when handed to carrier**\n• All transport modes\n\n✅ **Most versatile Incoterm** for EU road freight",
    answer_fr: "🚚 **FCA — Franco transporteur :**\n\n• Vendeur : livre au **transporteur désigné** au lieu convenu, gère la douane export\n• Acheteur : paie fret, assurance, douane import\n• Transfert de risque : **lors de la remise au transporteur**\n• Tous modes de transport\n\n✅ **Incoterm le plus polyvalent** pour le routier UE",
    suggests: [
      { label_en: "🏠 DAP", label_fr: "🏠 DAP", query: "dap delivered at place" },
      { label_en: "✅ DDP", label_fr: "✅ DDP", query: "ddp delivered duty paid" },
    ],
  },
  {
    keywords_en: ["dap","delivered at place","destination","door delivery"],
    keywords_fr: ["dap","rendu au lieu","destination","livraison domicile"],
    answer_en: "🏠 **DAP — Delivered at Place:**\n\n• Seller: handles everything including main freight to destination\n• Buyer: unloads + import customs & duties\n• Risk transfers: **when goods arrive at destination ready to unload**\n\n💡 Very common for EU B2B deliveries",
    answer_fr: "🏠 **DAP — Rendu au lieu de destination :**\n\n• Vendeur : gère tout y compris le fret jusqu'à destination\n• Acheteur : décharge + douane & droits import\n• Transfert de risque : **à l'arrivée à destination, prêt à décharger**\n\n💡 Très courant pour les livraisons B2B UE",
    suggests: [
      { label_en: "✅ DDP (go further)", label_fr: "✅ DDP (aller plus loin)", query: "ddp delivered duty paid" },
      { label_en: "🚚 FCA (less)", label_fr: "🚚 FCA (moins)", query: "fca free carrier" },
    ],
  },
  {
    keywords_en: ["ddp","delivered duty paid","all inclusive","customs paid"],
    keywords_fr: ["ddp","rendu droits acquittés","tout inclus","droits payés"],
    answer_en: "✅ **DDP — Delivered Duty Paid:**\n\nMaximum obligation for the seller.\n\n• Seller: pays **everything** — transport, insurance, export customs, main freight, import customs & duties/taxes\n• Buyer: simply receives the goods\n• Risk transfers: **at destination, import cleared**\n\n⚠️ Seller must have import registration in destination country",
    answer_fr: "✅ **DDP — Rendu droits acquittés :**\n\nObligation maximale pour le vendeur.\n\n• Vendeur : paie **tout** — transport, assurance, douane export, fret, douane import ET droits/taxes\n• Acheteur : reçoit simplement les marchandises\n• Transfert de risque : **à destination, dédouané**\n\n⚠️ Le vendeur doit avoir un enregistrement import dans le pays de destination",
    suggests: [
      { label_en: "🏠 DAP (less)", label_fr: "🏠 DAP (moins)", query: "dap delivered at place" },
      { label_en: "📋 All Incoterms", label_fr: "📋 Tous Incoterms", query: "incoterm overview" },
    ],
  },
  {
    keywords_en: ["cif","cost insurance freight","maritime","sea freight"],
    keywords_fr: ["cif","coût assurance fret","maritime","fret maritime"],
    answer_en: "🚢 **CIF — Cost, Insurance & Freight:**\n\n**Maritime and inland waterway ONLY!**\n\n• Seller: pays freight AND minimum insurance to destination port\n• Buyer: handles destination port costs, import customs\n• Risk transfers: **when goods on board at origin port**\n\n⚠️ For road transport, use **CIP** instead",
    answer_fr: "🚢 **CIF — Coût, assurance et fret :**\n\n**Maritime et fluvial UNIQUEMENT !**\n\n• Vendeur : paie le fret ET l'assurance minimum jusqu'au port destination\n• Acheteur : frais portuaires + douane import\n• Transfert de risque : **lors du chargement sur navire**\n\n⚠️ Pour la route, utilisez **CIP**",
    suggests: [
      { label_en: "⚓ FOB", label_fr: "⚓ FOB", query: "fob free on board vessel" },
      { label_en: "📋 All Incoterms", label_fr: "📋 Tous Incoterms", query: "incoterm overview" },
    ],
  },
  {
    keywords_en: ["fob","free on board","on board","vessel","ship"],
    keywords_fr: ["fob","franco à bord","navire","bateau"],
    answer_en: "⚓ **FOB — Free On Board:**\n\n**Maritime ONLY!**\n\n• Seller: delivers goods on board the vessel, handles export customs\n• Buyer: pays main freight, insurance, import customs\n• Risk transfers: **when goods are on board vessel**\n\n💡 Very common for sea container from Asia — use **FCA** for EU road",
    answer_fr: "⚓ **FOB — Franco à bord :**\n\n**Maritime UNIQUEMENT !**\n\n• Vendeur : livre à bord du navire, gère la douane export\n• Acheteur : fret, assurance, douane import\n• Transfert de risque : **lors du chargement à bord**\n\n💡 Très courant pour les conteneurs depuis l'Asie — utilisez **FCA** pour la route UE",
    suggests: [
      { label_en: "🚢 CIF", label_fr: "🚢 CIF", query: "cif cost insurance freight" },
      { label_en: "🚚 FCA (road)", label_fr: "🚚 FCA (route)", query: "fca free carrier" },
    ],
  },
  {
    keywords_en: ["distance","km","kilometre","route","calculate","far","how far","itinerary"],
    keywords_fr: ["distance","km","kilomètre","itinéraire","calculer","loin","combien de km"],
    answer_en: "📏 **Calculate road distance:**\n1. Go to **Distance Calculator**\n2. Enter origin & destination\n3. Get real road distance + travel time!\n\n🗺️ Powered by OSRM + OpenStreetMap.\n\n**Example distances:**\n• Paris → Lyon: ~465 km\n• Paris → Berlin: ~1,050 km\n• Paris → Madrid: ~1,270 km",
    answer_fr: "📏 **Calculer la distance routière :**\n1. Allez sur **Calculateur de distance**\n2. Entrez origine & destination\n3. Obtenez la distance réelle + temps de trajet !\n\n🗺️ Propulsé par OSRM + OpenStreetMap.\n\n**Exemples :**\n• Paris → Lyon : ~465 km\n• Paris → Berlin : ~1 050 km\n• Paris → Madrid : ~1 270 km",
    suggests: [
      { label_en: "💰 Then calculate cost", label_fr: "💰 Puis calculer le coût", query: "price cost rate" },
    ],
  },
  {
    keywords_en: ["service","offer","provide","specialize","about","company","lazard"],
    keywords_fr: ["service","offre","proposer","spécialité","à propos","entreprise","lazard"],
    answer_en: "🌍 **Lazard Transport — Our services:**\n• 🚚 Road freight France & EU\n• 📦 EUR pallet transport\n• 📍 Real-time shipment tracking\n• 📐 Distance & cost calculation\n• 📋 Incoterms guidance\n• 📄 Document generation (CMR, quotes)\n• 🔧 Logistics calculators\n• 🤖 AI assistant (billemax)\n\n🎓 School project — Lycée Simon Lazard",
    answer_fr: "🌍 **Lazard Transport — Nos services :**\n• 🚚 Transport routier France & UE\n• 📦 Transport palettes EUR\n• 📍 Suivi d'expédition temps réel\n• 📐 Calcul distance & coût\n• 📋 Conseils Incoterms\n• 📄 Génération documents (CMR, devis)\n• 🔧 Calculateurs logistiques\n• 🤖 Assistant IA (billemax)\n\n🎓 Projet scolaire — Lycée Simon Lazard",
    suggests: [
      { label_en: "💰 Get a quote", label_fr: "💰 Obtenir un devis", query: "price cost rate" },
      { label_en: "📞 Contact us", label_fr: "📞 Nous contacter", query: "contact phone email" },
    ],
  },
  {
    keywords_en: ["contact","phone","email","address","reach","call","write"],
    keywords_fr: ["contact","téléphone","email","adresse","joindre","appeler","écrire"],
    answer_en: "📞 **Contact Lazard Transport:**\n• Email: contact@lazard-transport.fr\n• Phone: +33 1 00 00 00 00\n• School: Lycée Simon Lazard, France\n\n📅 Use the **Contact** page to book an appointment!",
    answer_fr: "📞 **Contacter Lazard Transport :**\n• Email : contact@lazard-transport.fr\n• Tél. : +33 1 00 00 00 00\n• École : Lycée Simon Lazard, France\n\n📅 Utilisez la page **Contact** pour prendre rendez-vous !",
    suggests: [
      { label_en: "💰 Request quote", label_fr: "💰 Demander devis", query: "price cost rate" },
    ],
  },
  {
    keywords_en: ["customs","duty","clearance","import tax","vat","tariff"],
    keywords_fr: ["douane","droit","dédouanement","taxe import","tva","tarif douanier"],
    answer_en: "🛃 **EU Customs & Duties:**\n\n**Within EU:** No customs — free movement\n\n**Non-EU imports:**\n• Import duty: 0–20%+ depending on product\n• VAT at destination country rate (~20%)\n• EORI number required\n• Customs declaration (SAD/DAU) mandatory\n\n⚠️ Post-Brexit: UK ↔ EU requires full customs",
    answer_fr: "🛃 **Douanes & droits UE :**\n\n**Au sein de l'UE :** Pas de douane — libre circulation\n\n**Importations hors UE :**\n• Droits d'importation : 0–20%+ selon produit\n• TVA au taux du pays destination (~20%)\n• Numéro EORI requis\n• Déclaration douanière (DAU) obligatoire\n\n⚠️ Post-Brexit : UK ↔ UE = procédures douanières complètes",
    suggests: [
      { label_en: "📋 Incoterms", label_fr: "📋 Incoterms", query: "incoterm" },
      { label_en: "🌍 International", label_fr: "🌍 International", query: "international cross border europe" },
    ],
  },
  {
    keywords_en: ["insurance","assurance","cover","liability","damage","loss"],
    keywords_fr: ["assurance","couverture","responsabilité","dommage","perte"],
    answer_en: "🛡️ **Transport Insurance:**\n\n• **CMR liability:** Limited to 8.33 SDR/kg (~€11/kg) — often insufficient\n• **All-risks insurance:** Covers all loss/damage causes\n• **CIF & CIP:** Seller must provide minimum insurance\n\n💡 Always take all-risks cargo insurance for valuable goods!\n\nRemember: Incoterms define **who arranges** insurance, not who pays.",
    answer_fr: "🛡️ **Assurance transport :**\n\n• **Responsabilité CMR :** Limitée à 8,33 DTS/kg (~11€/kg) — souvent insuffisante\n• **Tous risques :** Couvre toutes causes de perte/dommage\n• **CIF & CIP :** Le vendeur doit fournir l'assurance minimale\n\n💡 Souscrivez toujours une assurance tous risques pour les envois de valeur !\n\nLes Incoterms définissent **qui doit souscrire**, pas qui paie.",
    suggests: [
      { label_en: "📜 CMR document", label_fr: "📜 Document CMR", query: "cmr consignment note" },
    ],
  },
  {
    keywords_en: ["fuel","diesel","petrol","consumption","litre","tank","fuel cost"],
    keywords_fr: ["carburant","diesel","gazole","consommation","litre","réservoir","coût carburant"],
    answer_en: "⛽ **Fuel consumption:**\n• Delivery Van: ~9 L/100km\n• Light Truck (7.5t): ~18 L/100km\n• Freight Truck (20t): ~28 L/100km\n• Semi-trailer (24t): ~36 L/100km\n\n**At 1.65 €/L:**\n• Van: ~14.85 €/100km\n• Semi: ~59.40 €/100km\n\n💰 Use the **Cost Simulator** for exact route estimates!",
    answer_fr: "⛽ **Consommation carburant :**\n• Camionnette : ~9 L/100km\n• Porteur léger (7,5t) : ~18 L/100km\n• Camion de fret (20t) : ~28 L/100km\n• Semi-remorque (24t) : ~36 L/100km\n\n**À 1,65 €/L :**\n• Camionnette : ~14,85 €/100km\n• Semi : ~59,40 €/100km\n\n💰 Utilisez le **Simulateur de coût** !",
    suggests: [
      { label_en: "💰 Full cost estimate", label_fr: "💰 Estimation complète", query: "price cost rate" },
    ],
  },
  {
    keywords_en: ["international","cross border","europe","abroad","foreign","import export transport"],
    keywords_fr: ["international","transfrontalier","europe","étranger","import export transport"],
    answer_en: "🌍 **International EU road transport:**\n\n**Key requirements:**\n• CMR consignment note (mandatory)\n• Community licence for haulier\n• Driver CPC certificate\n• ECMT permit for non-EU countries\n• Cabotage: max 3 operations in 7 days after international delivery\n\n**Lazard covers:** FR, DE, BE, ES, IT, NL and more!",
    answer_fr: "🌍 **Transport routier international UE :**\n\n**Exigences clés :**\n• Lettre de voiture CMR (obligatoire)\n• Licence communautaire transporteur\n• Certificat CPC chauffeur\n• Autorisation CEMT pour pays hors UE\n• Cabotage : max 3 opérations en 7 jours\n\n**Lazard couvre :** FR, DE, BE, ES, IT, NL et plus !",
    suggests: [
      { label_en: "🛃 Customs", label_fr: "🛃 Douanes", query: "customs duty clearance vat" },
      { label_en: "📜 CMR", label_fr: "📜 CMR", query: "cmr consignment note" },
    ],
  },
];

const DEFAULT: Record<Lang, string> = {
  en: "🤔 I'm not sure about that. Try asking about:\n• 💰 Prices · 📍 Tracking · 🚛 Driver rules\n• 📦 Pallets · 📋 Incoterms · 📄 Documents\n\nOr type **quiz** to test your logistics knowledge!",
  fr: "🤔 Je ne suis pas certain sur ce point. Essayez :\n• Fret maritime, aérien ou routier\n• UP, volume, poids taxable, BAF, CAF ou fret total\n• CMR, BL, AWB, Incoterms ou douane\n\nPour un calcul, indiquez les données et la formule de votre exercice.",
  ar: "🤔 لم أفهم سؤالك. يمكنك السؤال عن:\n• 💰 الأسعار · 📍 تتبع الشحنات · 🚛 قواعد السائقين\n• 📦 المنصات · 📋 إنكوترمز · 📄 الوثائق\n\nاكتب **quiz** لاختبار معلوماتك!",
};

// ═══════════════════════════════════════════════════════════════════════════
// KB RESPONSE ENGINE
// ═══════════════════════════════════════════════════════════════════════════
function getBotResponse(message: string, lang: Lang): { text: string; suggests?: SuggestItem[] } {
  const computed = getBacProCalculation(message);
  if (computed) return { text: computed };

  const topic = findBacProKnowledge(message);
  if (!topic) return { text: DEFAULT[lang] };
  return { text: topic.answer };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Chatbot() {
  const { lang, setLang } = useApp();
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [idCounter, setIdCounter] = useState(1);
  const [showActions, setShowActions] = useState(true);

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [awaitingQuizAnswer, setAwaitingQuizAnswer] = useState(false);

  // Document assistant state
  const [docActive, setDocActive] = useState(false);
  const [docStep, setDocStep] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Open: show random greeting
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = randomGreeting(lang);
      setMessages([{ role: "bot", text: welcome, id: 0 }]);
    }
  }, [open]);

  const nextId = useCallback(() => {
    setIdCounter(c => c + 1);
    return idCounter;
  }, [idCounter]);

  const addMsg = useCallback((role: "bot" | "user", text: string, extra?: Partial<Message>) => {
    const id = idCounter;
    setIdCounter(c => c + 1);
    setMessages(prev => [...prev, { role, text, id, ...extra }]);
  }, [idCounter]);

  // ── Quiz flow ──────────────────────────────────────────────────────────
  const startQuiz = useCallback(() => {
    setQuizActive(true);
    setQuizIndex(0);
    setQuizScore({ correct: 0, total: 0 });
    const q = QUIZ[0];
    const intro = lang === "fr"
      ? "🎓 **Mode Quiz — Logistique!**\nJe vais vous poser 8 questions. Cliquez sur la bonne réponse !\n\n"
      : "🎓 **Quiz Mode — Logistics!**\nI'll ask you 8 questions. Click the correct answer!\n\n";
    addMsg("bot", intro + (lang === "fr" ? q.q_fr : q.q_en), {
      quizOptions: { en: q.options_en, fr: q.options_fr },
    });
    setAwaitingQuizAnswer(true);
  }, [lang, addMsg]);

  const handleQuizAnswer = useCallback((answerIndex: number) => {
    const q = QUIZ[quizIndex];
    const isCorrect = answerIndex === q.correct;
    const newScore = { correct: quizScore.correct + (isCorrect ? 1 : 0), total: quizScore.total + 1 };
    setQuizScore(newScore);

    const chosenLabel = lang === "fr" ? q.options_fr[answerIndex] : q.options_en[answerIndex];
    addMsg("user", chosenLabel);

    const feedback = isCorrect
      ? (lang === "fr" ? q.explain_fr : q.explain_en)
      : (lang === "fr"
        ? `❌ Pas tout à fait. La bonne réponse est **${q.options_fr[q.correct]}**.\n\n${q.explain_fr.replace("✅ Correct !", "💡")}`
        : `❌ Not quite. The correct answer is **${q.options_en[q.correct]}**.\n\n${q.explain_en.replace("✅ Correct!", "💡")}`);

    const nextIdx = quizIndex + 1;
    setAwaitingQuizAnswer(false);

    if (nextIdx >= QUIZ.length) {
      // Quiz complete
      const pct = Math.round((newScore.correct / newScore.total) * 100);
      const badge = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚";
      const summary = lang === "fr"
        ? `\n\n${badge} **Score final : ${newScore.correct}/${newScore.total} (${pct}%)**\n${pct >= 80 ? "Excellent ! Vous êtes un expert logistique !" : pct >= 60 ? "Bien joué ! Continuez à apprendre !" : "Bonne tentative ! Relisez les règles UE et les Incoterms."}`
        : `\n\n${badge} **Final Score: ${newScore.correct}/${newScore.total} (${pct}%)**\n${pct >= 80 ? "Excellent! You're a logistics expert!" : pct >= 60 ? "Good job! Keep learning!" : "Good try! Review EU regulations and Incoterms."}`;
      setTimeout(() => {
        addMsg("bot", feedback + summary, { isResult: true });
        setQuizActive(false);
      }, 400);
    } else {
      const nextQ = QUIZ[nextIdx];
      const nextText = lang === "fr" ? nextQ.q_fr : nextQ.q_en;
      setTimeout(() => {
        addMsg("bot", feedback + "\n\n---\n\n" + nextText, {
          quizOptions: { en: nextQ.options_en, fr: nextQ.options_fr },
        });
        setQuizIndex(nextIdx);
        setAwaitingQuizAnswer(true);
      }, 400);
    }
  }, [quizIndex, quizScore, lang, addMsg]);

  // ── Document assistant flow ──────────────────────────────────────────
  const startDocAssistant = useCallback(() => {
    setDocActive(true);
    setDocStep(0);
    const step = DOC_FLOW[0];
    addMsg("bot", lang === "fr" ? step.q_fr : step.q_en, { docOptions: true });
  }, [lang, addMsg]);

  const handleDocAnswer = useCallback((yes: boolean) => {
    const step = DOC_FLOW[docStep];
    const chosenLabel = yes
      ? (lang === "fr" ? step.yes_fr : step.yes_en)
      : (lang === "fr" ? step.no_fr : step.no_en);
    addMsg("user", chosenLabel);

    const nextStep = yes ? step.yes_next : step.no_next;
    const resultDocs = yes ? step.yes_docs : step.no_docs;

    if (nextStep === "result" || resultDocs) {
      const docs = resultDocs ?? [];
      const intro = lang === "fr"
        ? "📄 **Documents requis pour votre envoi :**\n\n"
        : "📄 **Required documents for your shipment:**\n\n";
      const list = docs.map(d => `• ${d}`).join("\n");
      const outro = lang === "fr"
        ? "\n\n📋 Générez vos documents sur la page **Documents** !"
        : "\n\n📋 Generate your documents on the **Documents** page!";
      setTimeout(() => {
        addMsg("bot", intro + list + outro, { isResult: true });
        setDocActive(false);
      }, 300);
    } else {
      const next = DOC_FLOW[nextStep as number];
      setTimeout(() => {
        addMsg("bot", lang === "fr" ? next.q_fr : next.q_en, { docOptions: true });
        setDocStep(nextStep as number);
      }, 300);
    }
  }, [docStep, lang, addMsg]);

  // ── Main send handler ──────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setShowActions(false);

    // Auto-detect language
    const detected = detectLang(msg, lang);
    if (detected !== lang) setLang(detected);
    const useLang = detected;

    addMsg("user", msg);
    setTyping(true);

    // Special triggers
    const lower = msg.toLowerCase();
    const isQuizTrigger = lower.includes("quiz") || lower.includes("test") || lower.includes("اختبار");
    const isDocTrigger = lower.includes("document assistant") || lower.includes("assistant doc") || lower.includes("which document") || lower.includes("what document") || lower.includes("quel document") || lower.includes("assistant documentaire");

    await new Promise(r => setTimeout(r, 350));
    setTyping(false);

    if (isQuizTrigger) { startQuiz(); return; }
    if (isDocTrigger) { startDocAssistant(); return; }

    // Keep the active assistant limited to the curated Bac Pro knowledge base.
    // The provider hook remains available for a future, separately-scoped integration.
    const { text: botText, suggests } = getBotResponse(msg, useLang);
    addMsg("bot", botText, { suggests });
  }, [input, lang, setLang, addMsg, startQuiz, startDocAssistant]);

  const handleQuick = useCallback((query: string, label: string) => {
    setShowActions(false);
    addMsg("user", label);
    const lower = query.toLowerCase();
    const isQuiz = lower.includes("quiz");
    const isDoc = lower.includes("document assistant") || lower.includes("assistant documentaire");
    setTimeout(() => {
      if (isQuiz) { startQuiz(); return; }
      if (isDoc) { startDocAssistant(); return; }
      const { text, suggests } = getBotResponse(query, lang);
      addMsg("bot", text, { suggests });
    }, 300);
  }, [lang, addMsg, startQuiz, startDocAssistant]);

  const handleNav = useCallback((action: NavAction) => {
    setShowActions(false);
    const label = lang === "ar" ? (action.label_ar ?? action.label_en) : lang === "fr" ? action.label_fr : action.label_en;
    addMsg("user", `${action.emoji} ${label}`);
    setTimeout(() => {
      const msg = lang === "fr"
        ? `Navigation vers **${label}**…`
        : lang === "ar"
        ? `الانتقال إلى **${label}**…`
        : `Navigating to **${label}**…`;
      addMsg("bot", msg);
      navigate(action.path);
    }, 250);
  }, [lang, addMsg, navigate]);

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderText = (text: string) => {
    return text.split("\n").map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) =>
            j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>
          )}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });
  };

  // Current doc step (for rendering yes/no buttons)
  const currentDocStep = docActive ? DOC_FLOW[docStep] : null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1a2e4a] dark:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#243d62] dark:hover:bg-blue-600 transition-all duration-200 hover:scale-110"
        title="Ask billemax"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-16px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ height: "600px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a2e4a] to-[#2a4a7a] dark:from-slate-900 dark:to-slate-800 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">billemax</p>
              <p className="text-blue-200 text-xs truncate">
                {lang === "ar" ? "مساعد لازار للنقل الذكي" : lang === "en" ? "Lazard Transport Logistics AI" : "Assistant IA Lazard Transport"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-xs">{lang === "ar" ? "متصل" : lang === "en" ? "Online" : "En ligne"}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            {messages.map(msg => (
              <div key={msg.id}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 bg-[#1a2e4a] dark:bg-blue-700 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1a2e4a] dark:bg-blue-700 text-white rounded-br-sm"
                      : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-600"
                  }`}>
                    {renderText(msg.text)}
                  </div>
                </div>

                {/* Quiz options */}
                {msg.role === "bot" && msg.quizOptions && awaitingQuizAnswer && msg.id === messages[messages.length - 1]?.id && (
                  <div className="mt-2 pl-9 flex flex-col gap-1.5">
                    {(lang === "fr" ? msg.quizOptions.fr : msg.quizOptions.en).map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        className="text-left px-3 py-2 bg-blue-50 dark:bg-slate-700 text-[#1a2e4a] dark:text-blue-200 text-xs rounded-xl border border-blue-200 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-slate-600 transition font-medium"
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Document assistant yes/no */}
                {msg.role === "bot" && msg.docOptions && docActive && currentDocStep && msg.id === messages[messages.length - 1]?.id && (
                  <div className="mt-2 pl-9 flex gap-2">
                    <button
                      onClick={() => handleDocAnswer(true)}
                      className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-xl border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 transition font-medium"
                    >
                      ✅ {lang === "fr" ? currentDocStep.yes_fr : currentDocStep.yes_en}
                    </button>
                    <button
                      onClick={() => handleDocAnswer(false)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition font-medium"
                    >
                      ❌ {lang === "fr" ? currentDocStep.no_fr : currentDocStep.no_en}
                    </button>
                  </div>
                )}

                {/* Smart suggestions */}
                {msg.role === "bot" && msg.suggests && msg.suggests.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                  <div className="mt-1.5 pl-9 flex flex-wrap gap-1.5">
                    {msg.suggests.map((s, i) => {
                      const label = lang === "ar" ? (s.label_ar ?? s.label_en) : lang === "fr" ? s.label_fr : s.label_en;
                      return (
                        <button
                          key={i}
                          onClick={() => handleQuick(s.query, label)}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-[#1a2e4a] dark:bg-blue-700 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3 py-2.5 bg-white dark:bg-slate-700 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-600 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick action nav buttons (collapsible) */}
          <div className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <button
              onClick={() => setShowActions(a => !a)}
              className="w-full px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                {lang === "fr" ? "Actions rapides" : lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
              </span>
              {showActions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {showActions && (
              <div className="px-3 pb-2 grid grid-cols-4 gap-1.5">
                {NAV_ACTIONS.map((a) => {
                  const label = lang === "ar" ? (a.label_ar ?? a.label_en) : lang === "fr" ? a.label_fr : a.label_en;
                  return (
                    <button
                      key={a.path}
                      onClick={() => handleNav(a)}
                      className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 transition text-center"
                    >
                      <span className="text-lg leading-none">{a.emoji}</span>
                      <span className="text-[9px] text-slate-600 dark:text-slate-300 font-medium leading-tight line-clamp-2">{label}</span>
                    </button>
                  );
                })}
                {/* Extra: Quiz and Doc assistant */}
                <button
                  onClick={() => handleQuick("quiz", lang === "fr" ? "❓ Quiz" : lang === "ar" ? "❓ اختبار" : "❓ Quiz")}
                  className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-center"
                >
                  <span className="text-lg leading-none">🎓</span>
                  <span className="text-[9px] text-purple-700 dark:text-purple-300 font-medium leading-tight">
                    {lang === "fr" ? "Quiz" : lang === "ar" ? "اختبار" : "Quiz"}
                  </span>
                </button>
                <button
                  onClick={() => handleQuick("document assistant", lang === "fr" ? "📄 Assistant docs" : lang === "ar" ? "📄 مساعد الوثائق" : "📄 Doc assistant")}
                  className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition text-center"
                >
                  <span className="text-lg leading-none">📋</span>
                  <span className="text-[9px] text-green-700 dark:text-green-300 font-medium leading-tight line-clamp-2">
                    {lang === "fr" ? "Asst. docs" : lang === "ar" ? "الوثائق" : "Doc asst."}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={
                quizActive
                  ? (lang === "fr" ? "Cliquez une réponse ci-dessus…" : "Click an answer above…")
                  : docActive
                  ? (lang === "fr" ? "Cliquez oui ou non ci-dessus…" : "Click yes or no above…")
                  : lang === "ar"
                  ? "اكتب سؤالك هنا…"
                  : lang === "fr"
                  ? "Posez une question logistique…"
                  : "Ask about transport, Incoterms…"
              }
              disabled={quizActive || docActive}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 dark:focus:ring-blue-500/40 transition disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || quizActive || docActive}
              className="w-9 h-9 bg-[#1a2e4a] dark:bg-blue-700 hover:bg-[#243d62] dark:hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-600 text-white rounded-xl flex items-center justify-center transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pb-1.5 pt-0.5 text-[9px] text-slate-300 dark:text-slate-600 shrink-0 bg-white dark:bg-slate-800">
             billemax · {lang === "en" ? "Lazard Transport AI" : lang === "fr" ? "Assistant Bac Pro Transport" : "ذكاء لازار"} · {BAC_PRO_KB.length} {lang === "en" ? "topics" : lang === "fr" ? "thèmes de base" : "موضوع"}
            {import.meta.env.VITE_AI_PROVIDER_URL ? " · 🤖 AI connected" : ""}
          </div>
        </div>
      )}
    </>
  );
}
