import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

const STORAGE_KEY = "lazard-transport-school-notice-acknowledged";

export default function SchoolNotice() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = window.localStorage.getItem(STORAGE_KEY) === "true";
      setReady(true);
      if (!acknowledged) {
        requestAnimationFrame(() => setVisible(true));
      }
    } catch {
      setReady(true);
      requestAnimationFrame(() => setVisible(true));
    }
  }, []);

  const acknowledge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // The notice can still close when browser storage is unavailable.
    }
    setVisible(false);
  };

  if (!ready) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center p-3 sm:p-6 transition-all duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="school-notice-title"
        className={`relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#D9B75F]/50 bg-[#fffdf8] shadow-2xl transition-transform duration-300 dark:border-slate-600 dark:bg-slate-800 ${
          visible ? "translate-y-0" : "translate-y-8"
        }`}
      >
        <div className="h-1 bg-gradient-to-r from-[#1A2E4A] via-[#D9B75F] to-[#C94C4C]" />

        <div className="flex gap-3 p-4 sm:gap-5 sm:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A2E4A] text-[#F8F0E1] sm:h-12 sm:w-12">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="school-notice-title" className="text-base font-bold text-[#1A2E4A] sm:text-lg dark:text-white">
              ⚠️ Information
            </h2>

            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-[15px]">
              <p>Ce site web a été réalisé dans le cadre d’un projet scolaire de Bac Pro Transport – année 2025-2026.</p>
              <p>Il s’agit d’un projet réalisé à des fins éducatives et scolaires.</p>
              <p>Les informations présentes sur ce site sont destinées principalement aux élèves et à la découverte du domaine du transport et de la logistique.</p>
              <p>En continuant sur ce site, vous reconnaissez avoir pris connaissance de cette information.</p>
              <p className="pt-1 font-semibold text-[#1A2E4A] dark:text-blue-200">
                Projet réalisé par :<br />
                Hussein Ali Mohamed
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={acknowledge}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A2E4A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2A4A7A] focus:outline-none focus:ring-2 focus:ring-[#D9B75F] focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Compris
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}