import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

export default function Footer() {
  const { lang } = useApp();
  const tx = t[lang];
  const nav = tx.nav;
  const ft = tx.footer;

  return (
    <footer className="bg-[#1a2e4a] dark:bg-slate-950 text-white mt-16 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain rounded-full" />
            <div>
              <p className="font-bold text-white">Lazard Transport</p>
              <p className="text-xs text-blue-300">Lycée Simon Lazard · 2025</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{ft.desc}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">{ft.navTitle}</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/" className="hover:text-white transition">{nav.home}</Link></li>
            <li><Link href="/calculator" className="hover:text-white transition">{nav.calculator}</Link></li>
            <li><Link href="/distance" className="hover:text-white transition">{nav.distance}</Link></li>
            <li><Link href="/driver" className="hover:text-white transition">{nav.driver}</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">{nav.contact}</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">{ft.infoTitle}</p>
          <ul className="space-y-2 text-sm text-slate-300">
            {ft.info.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-slate-400">
        {ft.copyright}
      </div>
    </footer>
  );
}
