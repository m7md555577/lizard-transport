import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, ChevronDown, Truck, MapPin, FileText, Wrench, ClipboardList } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";
import type { Lang } from "@/context/AppContext";

const LANG_LABELS: Record<Lang, string> = { en: "EN", fr: "FR", ar: "ع" };
const LANG_NAMES: Record<Lang, string> = { en: "English", fr: "Français", ar: "العربية" };

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const { lang, setLang, theme, toggleTheme } = useApp();
  const tx = t[lang].nav;
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;

  const primaryLinks = [
    { href: "/", label: tx.home },
    { href: "/calculator", label: L("Calculator", "Calculateur", "الحاسبة") },
    { href: "/distance", label: tx.distance },
    { href: "/driver", label: L("Driver", "Chauffeur", "السائق"), icon: <Truck className="w-3.5 h-3.5" /> },
    { href: "/tracking", label: L("Tracking", "Suivi", "التتبع"), icon: <MapPin className="w-3.5 h-3.5" /> },
    { href: "/incoterms", label: "Incoterms", icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { href: "/contact", label: tx.contact },
  ];

  const toolLinks = [
    { href: "/documents", label: L("Transport Documents", "Documents", "وثائق النقل"), icon: <FileText className="w-4 h-4" />, desc: L("CMR, Quotation, Delivery Note", "CMR, Devis, Bon de livraison", "CMR، العروض، سندات التسليم") },
    { href: "/tools", label: L("Logistics Tools", "Outils logistiques", "أدوات اللوجستيات"), icon: <Wrench className="w-4 h-4" />, desc: L("Pallets, Volume, Cost Sim", "Palettes, Volume, Simulation coût", "المنصات، الحجم، تكلفة النقل") },
  ];

  const isToolActive = toolLinks.some(l => l.href === location);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo.png" alt="Lazard Transport" className="h-9 w-9 object-contain rounded-full" />
          <div className="leading-tight hidden sm:block">
            <span className="block font-bold text-[#1a2e4a] dark:text-blue-300 text-sm tracking-tight">
              {lang === "ar" ? "لازار للنقل" : "Lazard Transport"}
            </span>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {lang === "ar" ? "ثانوية سيمون لازار" : "Lycée Simon Lazard"}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
          {primaryLinks.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                location === href
                  ? "bg-[#1a2e4a] dark:bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}>
              <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
            </Link>
          ))}

          {/* Tools dropdown */}
          <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isToolActive
                ? "bg-[#1a2e4a] dark:bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}>
              <Wrench className="w-3.5 h-3.5" />
              {L("Tools", "Outils", "الأدوات")}
              <ChevronDown className={`w-3 h-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div className={`absolute top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 ${lang === "ar" ? "right-0" : "left-0"}`}>
                {toolLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setToolsOpen(false)}
                    className={`flex flex-col px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${location === link.href ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">{link.icon}{link.label}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{link.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Language selector + theme */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {/* 3-language pill selector */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
            {(["en", "fr", "ar"] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                title={LANG_NAMES[l]}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  lang === l
                    ? "bg-[#1a2e4a] dark:bg-blue-700 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                style={{ fontFamily: l === "ar" ? "Arial, sans-serif" : undefined }}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>

          <button onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {theme === "light"
              ? <><Moon className="w-3.5 h-3.5" />{L("Dark", "Sombre", "داكن")}</>
              : <><Sun className="w-3.5 h-3.5" />{L("Light", "Clair", "فاتح")}</>}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="xl:hidden p-2 text-slate-600 dark:text-slate-300 flex-shrink-0" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 pb-4">
          <div className="pt-2 space-y-1">
          {primaryLinks.map(({ href, label, icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location === href
                    ? "bg-[#1a2e4a] dark:bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}>
                <span className="inline-flex items-center gap-2">{icon}{label}</span>
              </Link>
            ))}
            <div className="px-4 pt-1 pb-0.5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {L("Tools", "Outils", "الأدوات")}
              </p>
            </div>
            {toolLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-[#1a2e4a] dark:bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}>
                <span className="inline-flex items-center gap-2">{link.icon}{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile lang + theme */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 mt-3 space-y-2">
            <div className="flex gap-1">
              {(["en", "fr", "ar"] as Lang[]).map(l => (
                <button key={l} onClick={() => { setLang(l); setOpen(false); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    lang === l
                      ? "bg-[#1a2e4a] dark:bg-blue-700 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  style={{ fontFamily: l === "ar" ? "Arial, sans-serif" : undefined }}>
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>
            <button onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              {theme === "light"
                ? <><Moon className="w-4 h-4" />{L("Dark mode", "Mode sombre", "الوضع الداكن")}</>
                : <><Sun className="w-4 h-4" />{L("Light mode", "Mode clair", "الوضع الفاتح")}</>}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
