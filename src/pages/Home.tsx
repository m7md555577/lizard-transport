import { Link } from "wouter";
import {
  ArrowRight, Truck, MapPin, Package, BarChart3, Shield, Clock,
  Zap, Globe, Lock, Star, CheckCircle, ChevronRight, Users, Award,
  Calculator, FileText, Bot, Ruler, AlertTriangle, Leaf, Route, Navigation, MessageCircle
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

const featureIcons = [
  <Truck className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
  <MapPin className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
  <Package className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
  <BarChart3 className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
  <Shield className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
  <Clock className="w-6 h-6 text-[#1a2e4a] dark:text-blue-400" />,
];

// ─── Why Choose section data ──────────────────────────────────────────────
const WHY_CARDS = (lang: "en" | "fr" | "ar") => [
  {
    icon: <Zap className="w-7 h-7 text-amber-500" />,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: lang === "en" ? "Fast & Reliable Delivery" : "Livraison rapide et fiable",
    desc: lang === "en"
      ? "Optimised routes help you plan with fewer surprises and a clearer delivery window."
      : lang === "fr"
        ? "Des itinéraires optimisés vous aident à planifier avec moins de surprises et un délai plus clair."
        : "المسارات المحسّنة تساعدك على التخطيط بوضوح أكبر ومفاجآت أقل في موعد التسليم.",
  },
  {
    icon: <Globe className="w-7 h-7 text-blue-500" />,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: lang === "en" ? "European Transport Network" : "Réseau de transport européen",
    desc: lang === "en"
      ? "Covering 22 EU countries with a dense network of certified partners and carriers."
      : lang === "fr"
        ? "Couvrant 22 pays de l'UE avec un réseau de partenaires et transporteurs."
        : "تغطية 22 دولة أوروبية مع شبكة من الشركاء والناقلين.",
  },
  {
    icon: <Lock className="w-7 h-7 text-green-500" />,
    bg: "bg-green-50 dark:bg-green-900/20",
    title: lang === "en" ? "Secure Goods Handling" : "Manipulation sécurisée des marchandises",
    desc: lang === "en"
      ? "Strict protocols for loading, securing, and monitoring your cargo at every stage."
      : lang === "fr"
        ? "Protocoles clairs pour le chargement, l'arrimage et le suivi de votre fret à chaque étape."
        : "إجراءات واضحة للتحميل والتثبيت ومتابعة شحنتك في كل مرحلة.",
  },
  {
    icon: <Star className="w-7 h-7 text-purple-500" />,
    bg: "bg-purple-50 dark:bg-purple-900/20",
    title: lang === "en" ? "Professional Certified Drivers" : "Chauffeurs professionnels certifiés",
    desc: lang === "en"
      ? "All drivers hold EU FIMO/FCO certification and comply strictly with Regulation 561/2006."
      : lang === "fr"
        ? "Les règles européennes et les temps de conduite sont pris en compte dans la planification."
        : "نأخذ اللوائح الأوروبية وأوقات القيادة والراحة بعين الاعتبار عند التخطيط.",
  },
  {
    icon: <MapPin className="w-7 h-7 text-red-500" />,
    bg: "bg-red-50 dark:bg-red-900/20",
    title: lang === "en" ? "Real-Time Shipment Tracking" : "Suivi d'expédition en temps réel",
    desc: lang === "en"
      ? "Live updates and animated route tracking so you always know where your shipment is."
      : lang === "fr"
        ? "Des mises à jour claires pour comprendre où se trouve votre expédition et quelle est la prochaine étape."
        : "تحديثات واضحة تساعدك على معرفة مكان الشحنة وما هي الخطوة التالية.",
  },
];

const HUMAN_STEPS = (lang: "en" | "fr" | "ar") => [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: lang === "en" ? "Start with the real details" : lang === "fr" ? "Commencer par les vrais détails" : "نبدأ بالتفاصيل الحقيقية",
    desc: lang === "en"
      ? "What are you moving, where is it going, and when does it need to arrive? Good planning starts with simple questions."
      : lang === "fr"
        ? "Que transportez-vous, où va la marchandise et pour quand ? Une bonne planification commence par des questions simples."
        : "ما الذي تنقله؟ إلى أين؟ ومتى يجب أن تصل الشحنة؟ التخطيط الجيد يبدأ بأسئلة بسيطة.",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: lang === "en" ? "Check what matters" : lang === "fr" ? "Vérifier l'essentiel" : "نتحقق من المهم",
    desc: lang === "en"
      ? "Capacity, route, documents, driving time and delivery constraints all affect the plan. The tools keep them visible."
      : lang === "fr"
        ? "Capacité, itinéraire, documents, temps de conduite et contraintes de livraison influencent le plan. Les outils les rendent visibles."
        : "السعة والمسار والوثائق ووقت القيادة وشروط التسليم تؤثر على الخطة. الأدوات تجمعها أمامك بوضوح.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: lang === "en" ? "Keep the conversation clear" : lang === "fr" ? "Garder les échanges simples" : "نبقي التواصل واضحاً",
    desc: lang === "en"
      ? "No unnecessary jargon. You get a practical estimate, the assumptions behind it, and a clear next step."
      : lang === "fr"
        ? "Pas de jargon inutile. Vous obtenez une estimation pratique, ses hypothèses et une prochaine étape claire."
        : "بدون تعقيد غير ضروري. تحصل على تقدير عملي وافتراضاته والخطوة التالية بوضوح.",
  },
];

// ─── Services data ────────────────────────────────────────────────────────
const SERVICES = (lang: "en" | "fr" | "ar") => [
  {
    image: "/illustrations/service-national.svg", alt: "National road transport",
    color: "border-blue-200 dark:border-blue-800",
    title: lang === "en" ? "National Transport" : "Transport national",
    desc: lang === "en" ? "Full and partial loads across all of France. Express and standard options." : "Charges complètes et partielles dans toute la France. Options express et standard.",
  },
  {
    image: "/illustrations/service-europe.svg", alt: "European road network",
    color: "border-green-200 dark:border-green-800",
    title: lang === "en" ? "International EU Transport" : "Transport international UE",
    desc: lang === "en" ? "Cross-border freight to 22 EU countries. Complete customs documentation." : "Fret transfrontalier vers 22 pays de l'UE. Documentation douanière complète.",
  },
  {
    image: "/illustrations/service-pallet.svg", alt: "EUR pallet transport",
    color: "border-amber-200 dark:border-amber-800",
    title: lang === "en" ? "EUR Pallet Transport" : "Transport de palettes EUR",
    desc: lang === "en" ? "Specialists in standard EUR pallets (80×120 cm). Up to 24 palettes per trailer." : "Spécialistes des palettes EUR standard (80×120 cm). Jusqu'à 24 palettes par remorque.",
  },
  {
    image: "/illustrations/service-route.svg", alt: "Route planning map",
    color: "border-purple-200 dark:border-purple-800",
    title: lang === "en" ? "Route & Logistics Planning" : "Planification logistique",
    desc: lang === "en" ? "Optimised multi-stop route planning with EU driver regulation compliance." : "Planification d'itinéraires multi-arrêts optimisés avec conformité à la réglementation UE.",
  },
  {
    image: "/illustrations/service-tracking.svg", alt: "Shipment tracking",
    color: "border-red-200 dark:border-red-800",
    title: lang === "en" ? "Live Shipment Tracking" : "Suivi en temps réel",
    desc: lang === "en" ? "Real-time animated map tracking with status updates at every milestone." : "Suivi cartographique animé en direct avec mises à jour de statut à chaque étape.",
  },
  {
    image: "/illustrations/service-documents.svg", alt: "Transport documents",
    color: "border-slate-200 dark:border-slate-700",
    title: lang === "en" ? "Incoterms Assistance" : "Assistance Incoterms",
    desc: lang === "en" ? "Find the right Incoterm for your trade terms: EXW, FCA, DAP, DDP and more." : "Trouvez le bon Incoterm pour vos conditions commerciales : EXW, FCA, DAP, DDP et plus.",
  },
];

// ─── Fleet data ───────────────────────────────────────────────────────────
const FLEET = (lang: "en" | "fr" | "ar") => [
  {
    image: "/illustrations/fleet-van.svg", alt: "Delivery van illustration",
    title: lang === "en" ? "Delivery Van" : "Camionnette de livraison",
    subtitle: lang === "en" ? "Up to 1.5 tonnes" : "Jusqu'à 1,5 tonne",
    gradient: "from-slate-700 to-slate-800",
    tags: lang === "en"
      ? ["Urban delivery", "Same-day option", "2–4 EUR pallets"]
      : ["Livraison urbaine", "Option même jour", "2–4 palettes EUR"],
    desc: lang === "en"
      ? "Ideal for short-distance urban and peri-urban deliveries. Manoeuvrable in city centres and narrow streets."
      : "Idéal pour les livraisons courtes distances urbaines et péri-urbaines. Maniable en centre-ville et rues étroites.",
  },
  {
    image: "/illustrations/fleet-truck.svg", alt: "Freight truck illustration",
    title: lang === "en" ? "Freight Truck" : "Camion de fret",
    subtitle: lang === "en" ? "Up to 20 tonnes" : "Jusqu'à 20 tonnes",
    gradient: "from-[#1a2e4a] to-[#2a4a7a]",
    tags: lang === "en"
      ? ["France & neighbouring EU", "6–12 EUR pallets", "Temperature monitoring"]
      : ["France & UE voisine", "6–12 palettes EUR", "Surveillance température"],
    desc: lang === "en"
      ? "Our workhorse for medium-haul routes across France and neighbouring countries. Equipped with GPS tracking."
      : "Notre véhicule de référence pour les trajets moyennes distances en France et pays voisins. Équipé GPS.",
  },
  {
    image: "/illustrations/fleet-trailer.svg", alt: "European trailer illustration",
    title: lang === "en" ? "European Trailer" : "Semi-remorque européen",
    subtitle: lang === "en" ? "Up to 24 tonnes · 33 pallets" : "Jusqu'à 24 tonnes · 33 palettes",
    gradient: "from-blue-900 to-blue-800",
    tags: lang === "en"
      ? ["Full EU coverage", "Up to 33 EUR pallets", "CMR certified"]
      : ["Couverture UE complète", "Jusqu'à 33 palettes EUR", "Certifié CMR"],
    desc: lang === "en"
      ? "Maximum capacity for long-haul international freight. CMR compliant with full EU regulatory documentation."
      : "Capacité maximale pour le fret international longue distance. Conforme CMR avec documentation réglementaire UE.",
  },
];

// ─── Partners (all fictional) ─────────────────────────────────────────────
const PARTNERS = [
  { name: "NordFreight SA", abbr: "NF", color: "bg-blue-700", country: "FR" },
  { name: "EuroTrans GmbH", abbr: "ET", color: "bg-slate-700", country: "DE" },
  { name: "LogiRoute SAS", abbr: "LR", color: "bg-green-700", country: "FR" },
  { name: "PalletPro BV", abbr: "PP", color: "bg-orange-600", country: "NL" },
  { name: "AlpineLink AG", abbr: "AL", color: "bg-red-700", country: "CH" },
  { name: "IberFret SL", abbr: "IF", color: "bg-purple-700", country: "ES" },
];

// ─── Stats ────────────────────────────────────────────────────────────────
const STATS = (lang: "en" | "fr" | "ar") => [
  { value: "15+", label: lang === "en" ? "Years of experience" : "Années d'expérience" },
  { value: "28 500+", label: lang === "en" ? "Deliveries completed" : "Livraisons effectuées" },
  { value: "22", label: lang === "en" ? "EU countries covered" : "Pays UE couverts" },
  { value: "87", label: lang === "en" ? "Professional drivers" : "Chauffeurs professionnels" },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function Home() {
  const { lang } = useApp();
  const tx = t[lang].home;

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1a2e4a] to-[#2a4a7a] dark:from-slate-900 dark:to-slate-800 text-white transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-blue-200">
              {tx.badge}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {tx.heroTitle1}<br />
              <span className="text-blue-300">{tx.heroTitle2}</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-lg">{tx.heroDesc}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/calculator"
                className="inline-flex items-center gap-2 bg-white text-[#1a2e4a] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition">
                {tx.ctaCalculate} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/distance"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
                {tx.ctaDistance}
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="Lazard Transport" className="w-52 h-52 object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ── Statistics ─────────────────────────────────────────────────── */}
      <section className="bg-[#1a2e4a] dark:bg-slate-900 text-white transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS(lang).map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-blue-300 mb-1">{value}</p>
                <p className="text-slate-300 text-sm">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">
            * {lang === "en" ? "Indicative figures for school presentation purposes only" : "Chiffres indicatifs à des fins de présentation scolaire uniquement"}
          </p>
        </div>
      </section>

      {/* ── Platform Features ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-[#1a2e4a]/10 dark:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1 rounded-full mb-3">
            {lang === "en" ? "Complete platform" : "Plateforme complète"}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
            {lang === "en" ? "Everything a logistics professional needs" : "Tout ce qu'un professionnel de la logistique attend"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {lang === "en"
              ? "8 integrated modules covering every aspect of European transport and logistics."
              : "8 modules intégrés couvrant tous les aspects du transport et de la logistique européens."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Calculator className="w-5 h-5" />, bg: "bg-blue-600", href: "/calculator",
              title: lang === "en" ? "Transport Calculator" : "Calculateur de transport",
              desc: lang === "en" ? "Instant cost estimate with fuel, tolls, driver & pallet breakdown" : "Estimation de coût instantanée : carburant, péages, chauffeur, palette",
              badge: lang === "en" ? "Calculator" : "Calculateur",
            },
            {
              icon: <Route className="w-5 h-5" />, bg: "bg-green-600", href: "/distance",
              title: lang === "en" ? "Distance & Route" : "Distance & Itinéraire",
              desc: lang === "en" ? "Real route distances between 25+ European cities with travel time" : "Distances réelles entre 25+ villes européennes avec temps de trajet",
              badge: lang === "en" ? "Route planner" : "Planificateur",
            },
            {
              icon: <Truck className="w-5 h-5" />, bg: "bg-[#1a2e4a]", href: "/driver",
              title: lang === "en" ? "Driver Panel" : "Espace chauffeur",
              desc: lang === "en" ? "EU regulation 561/2006 compliance, schedules, rest times & alerts" : "Conformité réglementation UE 561/2006, horaires, temps de repos",
              badge: "EU 561/2006",
            },
            {
              icon: <MapPin className="w-5 h-5" />, bg: "bg-red-600", href: "/tracking",
              title: lang === "en" ? "Shipment Tracking" : "Suivi d'expédition",
              desc: lang === "en" ? "Animated live map with milestone updates and delivery ETA" : "Carte animée en direct avec mises à jour et heure d'arrivée estimée",
              badge: lang === "en" ? "Live tracking" : "Suivi temps réel",
            },
            {
              icon: <FileText className="w-5 h-5" />, bg: "bg-purple-600", href: "/incoterms",
              title: lang === "en" ? "Incoterms Wizard" : "Assistant Incoterms",
              desc: lang === "en" ? "Answer 4 questions to get the right Incoterm: EXW, FCA, DAP, DDP…" : "4 questions pour trouver l'Incoterm adapté : EXW, FCA, DAP, DDP…",
              badge: "Incoterms 2020",
            },
            {
              icon: <Package className="w-5 h-5" />, bg: "bg-amber-600", href: "/documents",
              title: lang === "en" ? "Document Generator" : "Générateur de documents",
              desc: lang === "en" ? "Generate CMR consignment notes and delivery notes in one click" : "Générez des lettres de voiture CMR et bons de livraison en un clic",
              badge: "CMR / BL",
            },
            {
              icon: <Ruler className="w-5 h-5" />, bg: "bg-teal-600", href: "/tools",
              title: lang === "en" ? "Logistics Tools" : "Outils logistiques",
              desc: lang === "en" ? "Pallet, volume, LDM, CO₂, ADR reference, Geo Challenge & Dispatch Sim" : "Palette, volume, ML, CO₂, référence ADR, Géo Challenge & Dispatch Sim",
              badge: lang === "en" ? "8 tools" : "8 outils",
            },
            {
              icon: <Bot className="w-5 h-5" />, bg: "bg-gradient-to-br from-blue-600 to-purple-600", href: "/tools",
              title: "Ask billemax",
              desc: lang === "en" ? "AI logistics assistant. Ask any transport question in natural language" : "Assistant logistique IA. Posez vos questions en langage naturel",
              badge: "AI · GPT",
            },
          ].map(({ icon, bg, href, title, desc, badge }) => (
            <Link key={title} href={href}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{badge}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs text-[#1a2e4a] dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                {lang === "en" ? "Open" : "Ouvrir"} <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300 text-center mb-2">{tx.howTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-10">{tx.howSubtitle}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tx.steps.map((s) => (
            <div key={s.num} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-center transition-colors">
              <div className="text-4xl font-black text-blue-100 dark:text-slate-700 mb-3">{s.num}</div>
              <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Human approach ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-3xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-7 md:p-10">
          <div className="max-w-2xl mb-8">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-3">
              {lang === "en" ? "The human side of transport" : lang === "fr" ? "Le côté humain du transport" : "الجانب الإنساني للنقل"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-200 mb-3">
              {lang === "en"
                ? "Good logistics is also about listening."
                : lang === "fr"
                  ? "La bonne logistique, c'est aussi savoir écouter."
                  : "اللوجستيات الجيدة تبدأ أيضاً بالاستماع."}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === "en"
                ? "Lazard Transport is designed to make the practical side of a shipment easier to understand — for a student learning the subject or a team checking a real transport plan."
                : lang === "fr"
                  ? "Lazard Transport est conçu pour rendre la préparation d'une expédition plus simple à comprendre — pour un élève qui apprend ou une équipe qui vérifie un plan de transport."
                  : "صُمم موقع لازار للنقل لتسهيل فهم الجانب العملي من الشحنة، سواء لطالب يتعلم أو لفريق يراجع خطة نقل."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HUMAN_STEPS(lang).map((step, index) => (
              <div key={step.title} className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-5 border border-white dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1a2e4a] text-white flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">0{index + 1}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Lazard Transport ─────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-[#1a2e4a]/10 dark:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1 rounded-full mb-3">
              {lang === "en" ? "Our advantages" : "Nos avantages"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
              {lang === "en" ? "Why Choose Lazard Transport?" : "Pourquoi choisir Lazard Transport ?"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {lang === "en"
                ? "A complete logistics solution built on precision, reliability, and European expertise."
                : "Une solution logistique complète fondée sur la précision, la fiabilité et l'expertise européenne."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_CARDS(lang).map((card) => (
              <div key={card.title} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{card.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-[#1a2e4a] dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {lang === "en" ? "Included in all services" : "Inclus dans tous les services"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Services ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-[#1a2e4a]/10 dark:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1 rounded-full mb-3">
            {lang === "en" ? "What we offer" : "Ce que nous proposons"}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
            {lang === "en" ? "Our Services" : "Nos services"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {lang === "en"
              ? "A full range of professional logistics and transport solutions for businesses of all sizes."
              : "Une gamme complète de solutions logistiques professionnelles pour les entreprises de toute taille."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES(lang).map((svc) => (
            <div key={svc.title}
              className={`bg-white dark:bg-slate-800 rounded-2xl border ${svc.color} p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group`}>
               <div className="h-28 -mx-2 -mt-1 mb-4 overflow-hidden rounded-xl bg-[#f7f0e2] dark:bg-slate-700/60">
                 <img src={svc.image} alt={svc.alt} className="w-full h-full object-cover" />
               </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-lg">{svc.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{svc.desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] dark:text-blue-400">
                {lang === "en" ? "Learn more" : "En savoir plus"} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Fleet ───────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-[#1a2e4a]/10 dark:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1 rounded-full mb-3">
              {lang === "en" ? "Vehicle fleet" : "Parc de véhicules"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
              {lang === "en" ? "Our Fleet" : "Notre flotte"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {lang === "en"
                ? "Modern, GPS-equipped vehicles for every transport need — urban delivery to cross-border freight."
                : "Véhicules modernes équipés GPS pour chaque besoin de transport — livraison urbaine au fret transfrontalier."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLEET(lang).map((v) => (
              <div key={v.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                {/* Vehicle illustration card */}
                <div className={`bg-gradient-to-br ${v.gradient} h-44 flex items-center justify-center relative overflow-hidden`}>
                   <img src={v.image} alt={v.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex flex-wrap gap-1.5">
                      {v.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{v.title}</h3>
                  </div>
                  <p className="text-xs font-semibold text-[#1a2e4a] dark:text-blue-400 mb-3">{v.subtitle}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300 text-center mb-2">{tx.featuresTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-10">{tx.featuresSubtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tx.features.map((f, i) => (
              <div key={f.title}
                className="flex gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  {featureIcons[i]}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{f.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── billemax AI Assistant ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-br from-[#1a2e4a] via-blue-800 to-purple-800 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row items-center gap-10">
            {/* Left: description */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-300 uppercase tracking-widest">{lang === "en" ? "AI Logistics Assistant" : "Assistant logistique IA"}</div>
                  <div className="font-black text-2xl tracking-tight">billemax</div>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                {lang === "en"
                  ? "A friendly first stop for practical logistics questions. Ask billemax about routes, documents, pallets or driver rules — and get an answer without the jargon."
                  : lang === "fr"
                    ? "Un premier point de contact simple pour vos questions logistiques. Demandez à billemax des informations sur les itinéraires, documents, palettes ou règles chauffeur — sans jargon."
                    : "مساعد بسيط لأسئلة اللوجستيات العملية. اسأل billemax عن المسارات والوثائق والمنصات وقواعد السائقين بدون تعقيد."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(lang === "en" ? [
                  "What is an Incoterm DAP?",
                  "How many pallets fit in a trailer?",
                  "What documents are needed for ADR?",
                  "What is the CMR convention?",
                ] : [
                  "Qu'est-ce qu'un Incoterm DAP ?",
                  "Combien de palettes dans une semi ?",
                  "Quels documents pour l'ADR ?",
                  "Qu'est-ce que la convention CMR ?",
                ]).map(q => (
                  <div key={q} className="bg-white/10 rounded-xl px-4 py-2.5 text-sm text-blue-100 flex items-center gap-2">
                    <span className="text-blue-300 text-xs">▶</span> {q}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-sm font-medium">
                  {lang === "en" ? "Quick answers · Clear explanations" : lang === "fr" ? "Réponses rapides · Explications claires" : "إجابات سريعة · شرح واضح"}
                </span>
              </div>
            </div>

            {/* Right: chat preview */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 overflow-hidden">
                <div className="bg-white/10 px-4 py-3 flex items-center gap-2 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  <span className="text-xs text-blue-200 ml-2">billemax Chat</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">U</div>
                    <div className="bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-blue-100">
                      {lang === "en" ? "How many EUR pallets fit in a 13.6m trailer?" : "Combien de palettes EUR dans une semi 13,6m ?"}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">B</div>
                    <div className="bg-blue-600/40 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-blue-100">
                      {lang === "en"
                        ? "A standard 13.6m trailer is usually planned for 33 EUR pallet positions. The final load still depends on height, weight and the loading plan."
                        : lang === "fr"
                          ? "Une semi-remorque standard de 13,6 m est généralement planifiée pour 33 palettes EUR. La charge finale dépend aussi de la hauteur, du poids et du plan de chargement."
                          : "عادةً تُخطط المقطورة القياسية بطول 13.6م لـ 33 منصة EUR. الحمولة النهائية تعتمد أيضاً على الارتفاع والوزن وطريقة التحميل."}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">U</div>
                    <div className="bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-blue-100 flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-white/10">
                  <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-blue-300 text-xs flex-1">{lang === "en" ? "Ask a logistics question…" : "Posez une question logistique…"}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Partners ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-[#1a2e4a]/10 dark:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1 rounded-full mb-3">
            {lang === "en" ? "Fictional partners — school project demo" : "Partenaires fictifs — démo projet scolaire"}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
            {lang === "en" ? "Our Partners" : "Nos partenaires"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {lang === "en"
              ? "We work with a network of certified logistics partners across Europe."
              : "Nous travaillons avec un réseau de partenaires logistiques certifiés à travers l'Europe."}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((p) => (
            <div key={p.name}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className={`w-14 h-14 ${p.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <span className="text-white font-black text-xl tracking-tight">{p.abbr}</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{p.name}</p>
                 <span className="inline-flex items-center justify-center mt-1 min-w-8 h-5 px-1.5 rounded-full bg-[#f7f0e2] text-[10px] font-bold tracking-wider text-[#1a2e4a]">{p.country}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          {lang === "en"
             ? "All partner names are fictional and created for this school project demonstration only."
             : lang === "fr"
               ? "Tous les noms de partenaires sont fictifs et créés uniquement pour cette démonstration de projet scolaire."
               : "جميع أسماء الشركاء خيالية ومستخدمة لهذا العرض المدرسي فقط."}
        </p>
      </section>

      {/* ── Rates banner ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-r from-[#1a2e4a] to-[#2a4a7a] dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-200">
          <div>
            <h3 className="text-xl font-bold mb-1">{tx.ratesTitle}</h3>
            <p className="text-blue-200 text-sm">{tx.ratesSubtitle}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-black">1.20 €</p>
              <p className="text-blue-200 text-xs uppercase tracking-wide mt-1">{tx.perKm}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-black">5.00 €</p>
              <p className="text-blue-200 text-xs uppercase tracking-wide mt-1">{tx.perPallet}</p>
            </div>
          </div>
          <Link href="/calculator"
            className="bg-white text-[#1a2e4a] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition flex items-center gap-2 whitespace-nowrap">
            {tx.ratesCta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Incoterms CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-purple-700 to-blue-800 dark:from-purple-900 dark:to-blue-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
             <img src="/illustrations/service-documents.svg" alt="Incoterms documents" className="w-16 h-16 rounded-2xl object-cover" />
            <div>
              <h3 className="text-xl font-bold mb-1">
                {lang === "en" ? "Not sure which Incoterm to use?" : "Pas sûr de quel Incoterm utiliser ?"}
              </h3>
              <p className="text-purple-200 text-sm">
                {lang === "en"
                  ? "Answer 4 simple questions and get the right Incoterm for your shipment — EXW, FCA, DAP, DDP and more."
                  : "Répondez à 4 questions simples et obtenez le bon Incoterm pour votre expédition — EXW, FCA, DAP, DDP et plus."}
              </p>
            </div>
          </div>
          <Link href="/incoterms"
            className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition flex items-center gap-2 whitespace-nowrap flex-shrink-0">
            {lang === "en" ? "Find my Incoterm" : "Trouver mon Incoterm"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
