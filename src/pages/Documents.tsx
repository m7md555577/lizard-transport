import { useState, useRef } from "react";
import { FileText, FileCheck, Clipboard, History, Printer, Plus, Trash2, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────
type Tab = "cmr" | "quotation" | "delivery" | "history";
type DocHistoryEntry = { id: string; type: string; ref: string; date: string };

function genRef(prefix: string) {
  const now = new Date();
  const y = now.getFullYear();
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${y}-${rand}`;
}
function today() {
  return new Date().toISOString().split("T")[0];
}
function addDays(d: string, n: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}

// ─── Print helper ────────────────────────────────────────────────────────
function printDoc(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
      body{padding:24px;color:#111;font-size:13px;line-height:1.5}
      h1{font-size:20px;font-weight:900;color:#1a2e4a;margin-bottom:4px}
      h2{font-size:14px;font-weight:700;color:#1a2e4a;border-bottom:2px solid #1a2e4a;padding-bottom:4px;margin:16px 0 8px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #1a2e4a}
      .logo-block{font-weight:900;font-size:18px;color:#1a2e4a}
      .logo-block span{display:block;font-size:11px;font-weight:400;color:#666}
      .badge{background:#1a2e4a;color:#fff;padding:4px 12px;border-radius:4px;font-weight:700;font-size:16px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px}
      .field{margin-bottom:6px}
      .field label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666;display:block}
      .field span{font-weight:600;border-bottom:1px solid #ccc;display:block;padding:2px 0;min-height:20px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#1a2e4a;color:#fff;padding:6px 8px;text-align:left;font-size:11px}
      td{padding:6px 8px;border-bottom:1px solid #ddd;font-size:12px}
      .sig-block{margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px}
      .sig-box{border-top:2px solid #333;padding-top:8px;font-size:11px;color:#555}
      .footer{margin-top:24px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:8px}
      .ref{font-size:11px;color:#666}
      @media print{body{padding:12px}}
    </style>
  </head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ─── CMR Form ─────────────────────────────────────────────────────────────
interface CMRData {
  senderName: string; senderAddress: string; senderCountry: string; senderPhone: string;
  receiverName: string; receiverAddress: string; receiverCountry: string;
  carrierName: string; carrierAddress: string;
  loadingPlace: string; loadingDate: string;
  deliveryPlace: string;
  goodsDesc: string; pallets: string; weight: string; volume: string;
  driverName: string; vehicleReg: string;
}

function CMRTab({ onGenerate, lang }: { onGenerate: (ref: string) => void; lang: "en" | "fr" | "ar" }) {
  const ref = useRef(genRef("CMR"));
  const [d, setD] = useState<CMRData>({
    senderName: "", senderAddress: "", senderCountry: "France", senderPhone: "",
    receiverName: "", receiverAddress: "", receiverCountry: "",
    carrierName: "Lazard Transport SARL", carrierAddress: "Lycée Simon Lazard, France",
    loadingPlace: "", loadingDate: today(),
    deliveryPlace: "", goodsDesc: "", pallets: "", weight: "", volume: "",
    driverName: "", vehicleReg: "",
  });

  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;

  const generate = () => {
    const body = `
      <div class="header">
        <div class="logo-block">Lazard Transport<span>Lycée Simon Lazard — School project</span></div>
        <div style="text-align:right">
          <div class="badge">CMR</div>
          <div class="ref" style="margin-top:4px">${L("Ref", "Réf")} : ${ref.current}</div>
          <div class="ref">${L("Date", "Date")} : ${d.loadingDate}</div>
        </div>
      </div>
      <h1>Convention relative au contrat de transport international de marchandises par route</h1>
      <div class="grid" style="margin-top:16px">
        <div>
          <h2>${L("1. Sender (Consignor)", "1. Expéditeur (Chargeur)")}</h2>
          <div class="field"><label>${L("Company name", "Raison sociale")}</label><span>${d.senderName}</span></div>
          <div class="field"><label>${L("Address", "Adresse")}</label><span>${d.senderAddress}</span></div>
          <div class="field"><label>${L("Country", "Pays")}</label><span>${d.senderCountry}</span></div>
          <div class="field"><label>${L("Phone", "Téléphone")}</label><span>${d.senderPhone}</span></div>
        </div>
        <div>
          <h2>${L("2. Consignee (Receiver)", "2. Destinataire")}</h2>
          <div class="field"><label>${L("Company name", "Raison sociale")}</label><span>${d.receiverName}</span></div>
          <div class="field"><label>${L("Address", "Adresse")}</label><span>${d.receiverAddress}</span></div>
          <div class="field"><label>${L("Country", "Pays")}</label><span>${d.receiverCountry}</span></div>
        </div>
      </div>
      <div class="grid">
        <div>
          <h2>${L("3. Carrier", "3. Transporteur")}</h2>
          <div class="field"><label>${L("Company", "Société")}</label><span>${d.carrierName}</span></div>
          <div class="field"><label>${L("Address", "Adresse")}</label><span>${d.carrierAddress}</span></div>
        </div>
        <div>
          <h2>${L("4. Transport Details", "4. Détails du transport")}</h2>
          <div class="field"><label>${L("Loading place", "Lieu de chargement")}</label><span>${d.loadingPlace}</span></div>
          <div class="field"><label>${L("Loading date", "Date de chargement")}</label><span>${d.loadingDate}</span></div>
          <div class="field"><label>${L("Delivery place", "Lieu de livraison")}</label><span>${d.deliveryPlace}</span></div>
        </div>
      </div>
      <h2>${L("5. Goods Description", "5. Désignation des marchandises")}</h2>
      <table>
        <tr><th>${L("Description", "Désignation")}</th><th>${L("Pallets", "Palettes")}</th><th>${L("Gross weight (kg)", "Poids brut (kg)")}</th><th>${L("Volume (m³)", "Volume (m³)")}</th></tr>
        <tr><td>${d.goodsDesc}</td><td>${d.pallets} EUR</td><td>${d.weight} kg</td><td>${d.volume} m³</td></tr>
      </table>
      <div class="grid" style="margin-top:16px">
        <div>
          <h2>${L("6. Driver & Vehicle", "6. Chauffeur & Véhicule")}</h2>
          <div class="field"><label>${L("Driver name", "Nom du chauffeur")}</label><span>${d.driverName}</span></div>
          <div class="field"><label>${L("Vehicle registration", "Immatriculation")}</label><span>${d.vehicleReg}</span></div>
        </div>
        <div>
          <h2>${L("7. CMR Conditions", "7. Conditions CMR")}</h2>
          <p style="font-size:10px;color:#555;line-height:1.5">${L("This transport is carried out under the conditions of the Convention on the Contract for the International Carriage of Goods by Road (CMR), Geneva, 19 May 1956.", "Ce transport est effectué sous les conditions de la Convention relative au contrat de transport international de marchandises par route (CMR), Genève, 19 mai 1956.")}</p>
        </div>
      </div>
      <div class="sig-block">
        <div class="sig-box">${L("Sender signature & stamp", "Signature et cachet de l'expéditeur")}<br/><br/><br/></div>
        <div class="sig-box">${L("Carrier signature & stamp", "Signature et cachet du transporteur")}<br/><br/><br/></div>
        <div class="sig-box">${L("Consignee signature & stamp", "Signature et cachet du destinataire")}<br/><br/><br/></div>
      </div>
      <div class="footer">⚠️ ${L("School project document — Lazard Transport, Lycée Simon Lazard. Not a legally binding document.", "Document scolaire — Lazard Transport, Lycée Simon Lazard. Document non contractuel.")}</div>
    `;
    printDoc(`CMR ${ref.current} — Lazard Transport`, body);
    onGenerate(ref.current);
    ref.current = genRef("CMR");
  };

  const f = (key: keyof CMRData, label_en: string, label_fr: string, ph?: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L(label_en, label_fr)}</label>
      <input type="text" value={d[key]}
        onChange={e => setD(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={ph}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
    </div>
  );
  const fd = (key: keyof CMRData, label_en: string, label_fr: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L(label_en, label_fr)}</label>
      <input type="date" value={d[key]}
        onChange={e => setD(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">📄</span>
        <div>
          <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{L("CMR — International Consignment Note", "CMR — Lettre de voiture internationale")}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">{L("The CMR document is the standard contract for international road freight transport. Required for all cross-border shipments within the EU.", "La lettre CMR est le contrat standard pour le transport international de marchandises par route. Obligatoire pour toute expédition transfrontalière en UE.")}</p>
        </div>
      </div>

      {/* Sender */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">1. {L("Sender (Consignor)", "Expéditeur (Chargeur)")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {f("senderName", "Company name", "Raison sociale", "Lazard Transport SARL")}
          {f("senderPhone", "Phone", "Téléphone", "+33 1 00 00 00 00")}
          {f("senderAddress", "Address", "Adresse", "10 Rue de la Logistique, Paris")}
          {f("senderCountry", "Country", "Pays", "France")}
        </div>
      </div>

      {/* Receiver */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">2. {L("Consignee (Receiver)", "Destinataire")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {f("receiverName", "Company name", "Raison sociale")}
          {f("receiverCountry", "Country", "Pays")}
          {f("receiverAddress", "Address", "Adresse")}
        </div>
      </div>

      {/* Carrier */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">3. {L("Carrier", "Transporteur")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {f("carrierName", "Carrier company", "Société transporteur")}
          {f("carrierAddress", "Carrier address", "Adresse transporteur")}
        </div>
      </div>

      {/* Loading & delivery */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">4. {L("Transport Details", "Détails du transport")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {f("loadingPlace", "Loading place", "Lieu de chargement")}
          {fd("loadingDate", "Loading date", "Date de chargement")}
          {f("deliveryPlace", "Delivery place", "Lieu de livraison")}
        </div>
      </div>

      {/* Goods */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">5. {L("Goods Description", "Désignation des marchandises")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {f("goodsDesc", "Goods description", "Nature des marchandises", lang === "en" ? "Industrial components, palletized" : "Composants industriels palettisés")}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {f("pallets", "Pallets (EUR)", "Palettes (EUR)", "6")}
          {f("weight", "Gross weight (kg)", "Poids brut (kg)", "1500")}
          {f("volume", "Volume (m³)", "Volume (m³)", "4.2")}
        </div>
      </div>

      {/* Driver */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">6. {L("Driver & Vehicle", "Chauffeur & Véhicule")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {f("driverName", "Driver name", "Nom du chauffeur")}
          {f("vehicleReg", "Vehicle registration", "Immatriculation")}
        </div>
      </div>

      <button onClick={generate}
        className="w-full flex items-center justify-center gap-2 bg-[#1a2e4a] dark:bg-blue-700 hover:bg-[#243d62] dark:hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition text-sm">
        <Printer className="w-5 h-5" />
        {L("Generate & Print CMR Document", "Générer et imprimer le document CMR")}
      </button>
    </div>
  );
}

// ─── Quotation Form ───────────────────────────────────────────────────────
interface QuotData {
  customerName: string; customerCompany: string; customerEmail: string;
  from: string; to: string; distanceKm: string;
  vehicleType: string; pallets: string; weight: string;
}

function QuotationTab({ onGenerate, lang }: { onGenerate: (ref: string) => void; lang: "en" | "fr" | "ar" }) {
  const ref = useRef(genRef("QUOT"));
  const [d, setD] = useState<QuotData>({
    customerName: "", customerCompany: "", customerEmail: "",
    from: "", to: "", distanceKm: "",
    vehicleType: lang === "en" ? "Freight Truck (20t)" : "Camion de fret (20t)",
    pallets: "", weight: "",
  });

  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;

  const distKm = parseFloat(d.distanceKm) || 0;
  const pallets = parseInt(d.pallets) || 0;
  const freightCost = +(distKm * 1.2).toFixed(2);
  const palletSurcharge = +(pallets * 5).toFixed(2);
  const total = +(freightCost + palletSurcharge).toFixed(2);
  const validity = addDays(today(), 30);

  const generate = () => {
    const body = `
      <div class="header">
        <div class="logo-block">Lazard Transport<span>Lycée Simon Lazard — School project</span></div>
        <div style="text-align:right">
          <div class="badge">${L("QUOTATION", "DEVIS")}</div>
          <div class="ref" style="margin-top:4px">${L("Ref", "Réf")} : ${ref.current}</div>
          <div class="ref">${L("Date", "Date")} : ${today()}</div>
          <div class="ref">${L("Valid until", "Valable jusqu'au")} : ${validity}</div>
        </div>
      </div>
      <div class="grid">
        <div>
          <h2>${L("Customer Information", "Informations client")}</h2>
          <div class="field"><label>${L("Contact", "Contact")}</label><span>${d.customerName}</span></div>
          <div class="field"><label>${L("Company", "Société")}</label><span>${d.customerCompany}</span></div>
          <div class="field"><label>${L("Email", "Email")}</label><span>${d.customerEmail}</span></div>
        </div>
        <div>
          <h2>${L("Transport Details", "Détails du transport")}</h2>
          <div class="field"><label>${L("From", "De")}</label><span>${d.from}</span></div>
          <div class="field"><label>${L("To", "À")}</label><span>${d.to}</span></div>
          <div class="field"><label>${L("Distance", "Distance")}</label><span>${distKm} km</span></div>
          <div class="field"><label>${L("Vehicle type", "Type de véhicule")}</label><span>${d.vehicleType}</span></div>
        </div>
      </div>
      <h2>${L("Cargo Details", "Détails de la marchandise")}</h2>
      <table>
        <tr><th>${L("Description", "Désignation")}</th><th>${L("Qty", "Qté")}</th><th>${L("Unit price", "Prix unit.")}</th><th>${L("Total (€)", "Total (€)")}</th></tr>
        <tr><td>${L("Road freight", "Transport routier")} (${distKm} km × 1.20 €)</td><td>1</td><td>${freightCost.toFixed(2)} €</td><td>${freightCost.toFixed(2)} €</td></tr>
        <tr><td>${L("Pallet surcharge", "Supplément palette")} (${pallets} × 5.00 €)</td><td>${pallets}</td><td>5.00 €</td><td>${palletSurcharge.toFixed(2)} €</td></tr>
        <tr style="background:#f8f9fa;font-weight:700">
          <td colspan="3">${L("TOTAL EXCL. VAT", "TOTAL HT")}</td><td>${total.toFixed(2)} €</td>
        </tr>
        <tr style="background:#1a2e4a;color:#fff;font-weight:700">
          <td colspan="3">${L("TOTAL INCL. VAT (20%)", "TOTAL TTC (TVA 20%)")}</td><td>${(total * 1.2).toFixed(2)} €</td>
        </tr>
      </table>
      <div class="sig-block">
        <div class="sig-box" style="grid-column:1/3">
          <p style="font-size:11px;color:#555;margin-bottom:8px">${L("This quotation is valid for 30 days from the date of issue. Prices are indicative.", "Ce devis est valable 30 jours à compter de la date d'émission. Les prix sont indicatifs.")}</p>
          ${L("Accepted by customer (date & signature):", "Accepté par le client (date et signature) :")}
          <br/><br/><br/>
        </div>
        <div class="sig-box">${L("Lazard Transport stamp & signature", "Cachet et signature Lazard Transport")}<br/><br/><br/></div>
      </div>
      <div class="footer">⚠️ ${L("School project quotation — Lazard Transport, Lycée Simon Lazard. Not a legally binding document.", "Devis scolaire — Lazard Transport, Lycée Simon Lazard. Document non contractuel.")}</div>
    `;
    printDoc(`${L("Quotation", "Devis")} ${ref.current} — Lazard Transport`, body);
    onGenerate(ref.current);
    ref.current = genRef("QUOT");
  };

  const f = (key: keyof QuotData, label_en: string, label_fr: string, ph?: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L(label_en, label_fr)}</label>
      <input type="text" value={d[key]}
        onChange={e => setD(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={ph}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">📊</span>
        <div>
          <p className="font-semibold text-green-700 dark:text-green-300 text-sm">{L("Transport Quotation", "Devis de transport")}</p>
          <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">{L("Generate a professional transport quotation with automatic price calculation.", "Générez un devis de transport professionnel avec calcul automatique du prix.")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Customer Information", "Informations client")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {f("customerName", "Contact name", "Nom du contact")}
          {f("customerCompany", "Company", "Société")}
          {f("customerEmail", "Email", "Email")}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Transport Route", "Itinéraire de transport")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {f("from", "From (city)", "De (ville)", "Paris, France")}
          {f("to", "To (city)", "À (ville)", "Berlin, Germany")}
          {f("distanceKm", "Distance (km)", "Distance (km)", "1054")}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Cargo & Vehicle", "Marchandise & Véhicule")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Vehicle type", "Type de véhicule")}</label>
            <select value={d.vehicleType} onChange={e => setD(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition">
              <option>{L("Delivery Van (1.5t)", "Camionnette (1,5t)")}</option>
              <option>{L("Freight Truck (20t)", "Camion de fret (20t)")}</option>
              <option>{L("European Trailer (24t)", "Semi-remorque (24t)")}</option>
            </select>
          </div>
          {f("pallets", "EUR Pallets", "Palettes EUR", "6")}
          {f("weight", "Total weight (kg)", "Poids total (kg)", "1500")}
        </div>
      </div>

      {/* Price preview */}
      {distKm > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#1a2e4a] dark:border-blue-700 p-5">
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Price Estimate", "Estimation du prix")}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">{L("Road freight", "Transport routier")} ({distKm} km × 1.20 €)</span><span className="font-semibold">{freightCost.toFixed(2)} €</span></div>
            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">{L("Pallet surcharge", "Supplément palette")} ({pallets} × 5.00 €)</span><span className="font-semibold">{palletSurcharge.toFixed(2)} €</span></div>
            <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-bold text-base">
              <span>{L("Total excl. VAT", "Total HT")}</span><span className="text-[#1a2e4a] dark:text-blue-300">{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{L("Total incl. VAT (20%)", "Total TTC (TVA 20%)")}</span><span>{(total * 1.2).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>{L("Valid until", "Valable jusqu'au")}</span><span>{validity}</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={generate}
        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition text-sm">
        <Printer className="w-5 h-5" />
        {L("Generate & Print Quotation", "Générer et imprimer le devis")}
      </button>
    </div>
  );
}

// ─── Delivery Note Form ────────────────────────────────────────────────────
interface DeliveryItem { description: string; qty: string; unit: string }
interface DeliveryData {
  customerName: string; customerCompany: string; deliveryAddress: string;
  deliveryDate: string; driverName: string; orderRef: string;
}

function DeliveryTab({ onGenerate, lang }: { onGenerate: (ref: string) => void; lang: "en" | "fr" | "ar" }) {
  const ref = useRef(genRef("BL"));
  const [d, setD] = useState<DeliveryData>({
    customerName: "", customerCompany: "", deliveryAddress: "",
    deliveryDate: today(), driverName: "", orderRef: "",
  });
  const [items, setItems] = useState<DeliveryItem[]>([
    { description: "", qty: "1", unit: lang === "en" ? "EUR pallet" : "Palette EUR" },
  ]);

  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;

  const addItem = () => setItems(prev => [...prev, { description: "", qty: "1", unit: lang === "en" ? "EUR pallet" : "Palette EUR" }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof DeliveryItem, val: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const generate = () => {
    const rows = items.map(it => `<tr><td>${it.description}</td><td style="text-align:center">${it.qty}</td><td>${it.unit}</td><td style="text-align:center">☐</td></tr>`).join("");
    const body = `
      <div class="header">
        <div class="logo-block">Lazard Transport<span>Lycée Simon Lazard — School project</span></div>
        <div style="text-align:right">
          <div class="badge">${L("DELIVERY NOTE", "BON DE LIVRAISON")}</div>
          <div class="ref" style="margin-top:4px">${L("Ref", "Réf")} : ${ref.current}</div>
          <div class="ref">${L("Date", "Date")} : ${d.deliveryDate}</div>
          ${d.orderRef ? `<div class="ref">${L("Order ref", "Réf commande")} : ${d.orderRef}</div>` : ""}
        </div>
      </div>
      <div class="grid">
        <div>
          <h2>${L("Customer", "Client")}</h2>
          <div class="field"><label>${L("Contact", "Contact")}</label><span>${d.customerName}</span></div>
          <div class="field"><label>${L("Company", "Société")}</label><span>${d.customerCompany}</span></div>
        </div>
        <div>
          <h2>${L("Delivery Details", "Détails de livraison")}</h2>
          <div class="field"><label>${L("Delivery address", "Adresse de livraison")}</label><span>${d.deliveryAddress}</span></div>
          <div class="field"><label>${L("Delivery date", "Date de livraison")}</label><span>${d.deliveryDate}</span></div>
          <div class="field"><label>${L("Driver", "Chauffeur")}</label><span>${d.driverName}</span></div>
        </div>
      </div>
      <h2>${L("Items Delivered", "Articles livrés")}</h2>
      <table>
        <tr><th>${L("Description", "Désignation")}</th><th style="text-align:center">${L("Qty", "Qté")}</th><th>${L("Unit", "Unité")}</th><th style="text-align:center">${L("Received ✓", "Reçu ✓")}</th></tr>
        ${rows}
      </table>
      <div class="sig-block" style="margin-top:32px">
        <div class="sig-box">${L("Driver signature", "Signature chauffeur")}<br/><br/><br/></div>
        <div class="sig-box">${L("Customer signature", "Signature client")}<br/><br/><br/></div>
        <div class="sig-box">${L("Date & time of delivery", "Date et heure de livraison")}<br/><br/><br/></div>
      </div>
      <div class="footer">⚠️ ${L("School project document — Lazard Transport, Lycée Simon Lazard. Not a legally binding document.", "Document scolaire — Lazard Transport, Lycée Simon Lazard. Document non contractuel.")}</div>
    `;
    printDoc(`${L("Delivery Note", "Bon de livraison")} ${ref.current} — Lazard Transport`, body);
    onGenerate(ref.current);
    ref.current = genRef("BL");
  };

  const fld = (key: keyof DeliveryData, label_en: string, label_fr: string, ph?: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L(label_en, label_fr)}</label>
      <input type="text" value={d[key]}
        onChange={e => setD(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={ph}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">📋</span>
        <div>
          <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">{L("Delivery Note (Bon de livraison)", "Bon de livraison")}</p>
          <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">{L("A delivery note confirms the goods delivered to the customer and requires a signature upon receipt.", "Le bon de livraison confirme les marchandises livrées au client et nécessite une signature à la réception.")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-4">{L("Customer & Delivery Info", "Client & Info livraison")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fld("customerName", "Contact name", "Nom du contact")}
          {fld("customerCompany", "Company", "Société")}
          {fld("deliveryAddress", "Delivery address", "Adresse de livraison")}
          {fld("driverName", "Driver name", "Nom du chauffeur")}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{L("Delivery date", "Date de livraison")}</label>
            <input type="date" value={d.deliveryDate}
              onChange={e => setD(prev => ({ ...prev, deliveryDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 transition" />
          </div>
          {fld("orderRef", "Order reference (optional)", "Référence commande (optionnel)")}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300">{L("Items Delivered", "Articles livrés")}</h3>
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-[#1a2e4a] dark:text-blue-400 font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" /> {L("Add item", "Ajouter un article")}
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                placeholder={L("Description", "Désignation")}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
              <input type="text" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)}
                placeholder={L("Qty", "Qté")} className="w-16 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
              <input type="text" value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)}
                placeholder={L("Unit", "Unité")} className="w-28 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40" />
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 transition flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={generate}
        className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition text-sm">
        <Printer className="w-5 h-5" />
        {L("Generate & Print Delivery Note", "Générer et imprimer le bon de livraison")}
      </button>
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────
function HistoryTab({ history, onClear, lang }: { history: DocHistoryEntry[]; onClear: () => void; lang: "en" | "fr" | "ar" }) {
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;
  const typeLabel: Record<string, string> = {
    CMR: L("CMR Document", "Document CMR"),
    QUOT: L("Quotation", "Devis"),
    BL: L("Delivery Note", "Bon de livraison"),
  };
  const typeBg: Record<string, string> = {
    CMR: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    QUOT: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    BL: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {history.length === 0
            ? L("No documents generated yet.", "Aucun document généré pour l'instant.")
            : `${history.length} ${L("document(s) generated this session.", "document(s) généré(s) cette session.")}`}
        </p>
        {history.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold transition">
            <Trash2 className="w-3.5 h-3.5" /> {L("Clear history", "Effacer l'historique")}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {L("Generate documents from the other tabs — they will appear here.", "Générez des documents depuis les autres onglets — ils apparaîtront ici.")}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">{L("Reference", "Référence")}</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">{L("Type", "Type")}</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">{L("Date & Time", "Date & Heure")}</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="px-5 py-3 font-mono font-semibold text-[#1a2e4a] dark:text-blue-300">{entry.ref}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${typeBg[entry.type]}`}>
                      {typeLabel[entry.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function Documents() {
  const { lang } = useApp();
  const L = (en: string, fr: string, ar = en) => lang === "ar" ? ar : lang === "en" ? en : fr;

  const [activeTab, setActiveTab] = useState<Tab>("cmr");
  const [history, setHistory] = useState<DocHistoryEntry[]>([]);

  const addToHistory = (type: string, ref: string) => {
    const entry: DocHistoryEntry = {
      id: crypto.randomUUID(),
      type,
      ref,
      date: new Date().toLocaleString(lang === "en" ? "en-GB" : "fr-FR"),
    };
    setHistory(prev => [...prev, entry]);
  };

  const tabs: { id: Tab; label_en: string; label_fr: string; icon: React.ReactNode; color: string }[] = [
    { id: "cmr", label_en: "CMR Document", label_fr: "Document CMR", icon: <FileText className="w-4 h-4" />, color: "blue" },
    { id: "quotation", label_en: "Quotation", label_fr: "Devis", icon: <FileCheck className="w-4 h-4" />, color: "green" },
    { id: "delivery", label_en: "Delivery Note", label_fr: "Bon de livraison", icon: <Clipboard className="w-4 h-4" />, color: "amber" },
    { id: "history", label_en: `History (${history.length})`, label_fr: `Historique (${history.length})`, icon: <History className="w-4 h-4" />, color: "slate" },
  ];

  const tabColorClass: Record<string, string> = {
    blue: "bg-blue-700",
    green: "bg-green-700",
    amber: "bg-amber-600",
    slate: "bg-slate-600",
  };

  const activeColor = tabs.find(t => t.id === activeTab)?.color ?? "blue";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 bg-[#1a2e4a] dark:bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">
            {L("Transport Documents", "Documents de transport")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {L("Generate, preview and print professional European transport documents.", "Générez, visualisez et imprimez des documents de transport européens professionnels.")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? `${tabColorClass[tab.color]} text-white shadow-sm`
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}>
            {tab.icon}
            {lang === "en" ? tab.label_en : tab.label_fr}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "cmr" && <CMRTab onGenerate={(ref) => addToHistory("CMR", ref)} lang={lang} />}
      {activeTab === "quotation" && <QuotationTab onGenerate={(ref) => addToHistory("QUOT", ref)} lang={lang} />}
      {activeTab === "delivery" && <DeliveryTab onGenerate={(ref) => addToHistory("BL", ref)} lang={lang} />}
      {activeTab === "history" && <HistoryTab history={history} onClear={() => setHistory([])} lang={lang} />}
    </div>
  );
}
