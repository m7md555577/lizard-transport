import { useApp } from "@/context/AppContext";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const { lang } = useApp();

  const txt = {
    en: {
      title: "404 — Page Not Found",
      desc: "The page you are looking for does not exist or has been moved.",
      btn: "Return to Home",
    },
    fr: {
      title: "404 — Page introuvable",
      desc: "La page que vous recherchez n'existe pas ou a été déplacée.",
      btn: "Retour à l'accueil",
    },
    ar: {
      title: "404 — الصفحة غير موجودة",
      desc: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
      btn: "العودة إلى الرئيسية",
    },
  };

  const tx = txt[lang] ?? txt.en;

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300 mb-3">{tx.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{tx.desc}</p>
        <Link href="/"
          className="inline-flex items-center gap-2 bg-[#1a2e4a] dark:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#243d5e] dark:hover:bg-blue-600 transition">
          <Home className="w-4 h-4" /> {tx.btn}
        </Link>
      </div>
    </div>
  );
}
