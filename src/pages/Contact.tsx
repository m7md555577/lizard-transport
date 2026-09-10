import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

export default function Contact() {
  const { lang } = useApp();
  const tx = t[lang].contact;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); };
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const inputClass = "w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 dark:focus:ring-blue-500/40 transition";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">{tx.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{tx.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info */}
        <div className="space-y-6">
          <div className="bg-[#1a2e4a] dark:bg-slate-800 text-white rounded-2xl p-6 border dark:border-slate-700 transition-colors">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full mb-4" />
            <h2 className="font-bold text-lg">Lazard Transport</h2>
            <p className="text-blue-200 dark:text-blue-400 text-sm mt-1">Lycée Simon Lazard · 2025</p>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">{t[lang].footer.desc}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 transition-colors">
            {[
              { icon: <MapPin className="w-4 h-4 text-[#1a2e4a] dark:text-blue-400" />, label: tx.schoolLabel, val: "Lycée Simon Lazard\nFrance" },
              { icon: <Mail className="w-4 h-4 text-[#1a2e4a] dark:text-blue-400" />, label: tx.emailLabel, val: "contact@lazard-transport.fr" },
              { icon: <Phone className="w-4 h-4 text-[#1a2e4a] dark:text-blue-400" />, label: tx.phoneLabel, val: "+33 1 00 00 00 00" },
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-line">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 transition-colors">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-4">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{tx.sentTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">{tx.sentDesc}</p>
              <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-2 px-5 py-2.5 bg-[#1a2e4a] dark:bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-[#243d62] dark:hover:bg-blue-600 transition">
                {tx.sentAgain}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-5">{tx.formTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.nameLabel}</label>
                  <input type="text" value={form.name} onChange={set("name")} required placeholder={tx.namePh} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.emailInputLabel}</label>
                  <input type="email" value={form.email} onChange={set("email")} required placeholder={tx.emailPh} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.subjectLabel}</label>
                <select value={form.subject} onChange={set("subject")} required className={inputClass}>
                  <option value="">{tx.subjectDefault}</option>
                  {tx.subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tx.messageLabel}</label>
                <textarea value={form.message} onChange={set("message")} required rows={5}
                  placeholder={tx.messagePh} className={`${inputClass} resize-none`} />
              </div>
              <button type="submit"
                className="w-full bg-[#1a2e4a] hover:bg-[#243d62] dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <Send className="w-4 h-4" /> {tx.sendBtn}
              </button>
              <p className="text-xs text-center text-slate-400 dark:text-slate-500">{tx.disclaimer}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
