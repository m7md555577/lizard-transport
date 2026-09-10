import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Package, MapPin, CheckCircle, Clock, Loader2, Truck, User, Calendar } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

// ─── Fix Leaflet icons ────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Fake shipment database ───────────────────────────────────────────────
type Status = "preparing" | "transit" | "delivered";
interface Shipment {
  origin: string; dest: string;
  oCoords: [number, number]; dCoords: [number, number];
  status: Status; date: string; driver: string; pallets: number;
  distKm: number;
}

const SHIPMENTS: Record<string, Shipment> = {
  "LT2025001": {
    origin: "Paris, France", dest: "Berlin, Germany",
    oCoords: [48.8566, 2.3522], dCoords: [52.5200, 13.4050],
    status: "transit", date: "10 Jun 2025", driver: "Jean Dupont", pallets: 6, distKm: 1054,
  },
  "LT2025002": {
    origin: "Lyon, France", dest: "Madrid, Spain",
    oCoords: [45.7640, 4.8357], dCoords: [40.4168, -3.7038],
    status: "delivered", date: "08 Jun 2025", driver: "Pierre Martin", pallets: 12, distKm: 1410,
  },
  "LT2025003": {
    origin: "Marseille, France", dest: "Rome, Italy",
    oCoords: [43.2965, 5.3698], dCoords: [41.9028, 12.4964],
    status: "preparing", date: "12 Jun 2025", driver: "Marc Leblanc", pallets: 4, distKm: 995,
  },
  "LT2025004": {
    origin: "Bordeaux, France", dest: "Amsterdam, Netherlands",
    oCoords: [44.8378, -0.5792], dCoords: [52.3676, 4.9041],
    status: "transit", date: "09 Jun 2025", driver: "Sophie Durand", pallets: 8, distKm: 1322,
  },
  "LT2025005": {
    origin: "Toulouse, France", dest: "Warsaw, Poland",
    oCoords: [43.6047, 1.4442], dCoords: [52.2297, 21.0122],
    status: "transit", date: "10 Jun 2025", driver: "Michel Rousseau", pallets: 10, distKm: 2180,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────
function interpolate(a: [number, number], b: [number, number], steps: number): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as [number, number];
  });
}

// ─── Map auto-fit ─────────────────────────────────────────────────────────
function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [points, map]);
  return null;
}

// ─── Animated truck marker ────────────────────────────────────────────────
function AnimatedTruck({ routePoints, status }: { routePoints: [number, number][]; status: Status }) {
  const startIdx = status === "preparing" ? 0
    : status === "delivered" ? routePoints.length - 1
    : Math.floor(routePoints.length * 0.22);

  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    setIdx(startIdx);
    if (status !== "transit") return;
    let cur = startIdx;
    const loopEnd = Math.floor(routePoints.length * 0.88);
    const interval = setInterval(() => {
      cur++;
      if (cur > loopEnd) cur = Math.floor(routePoints.length * 0.12);
      setIdx(cur);
    }, 55);
    return () => clearInterval(interval);
  }, [status, routePoints, startIdx]);

  const truckIcon = useMemo(() => L.divIcon({
    className: "",
    html: `<div style="font-size:22px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35));transform:scaleX(${status === 'transit' ? 1 : 1})">🚛</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }), [status]);

  if (!routePoints[idx]) return null;
  return (
    <Marker position={routePoints[idx]} icon={truckIcon}>
      <Popup className="text-sm font-semibold">🚛 Shipment in {status === "transit" ? "transit" : status}</Popup>
    </Marker>
  );
}

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_STEPS: Status[] = ["preparing", "transit", "delivered"];

// ─── Main component ───────────────────────────────────────────────────────
export default function Tracking() {
  const { lang } = useApp();
  const tx = t[lang].tracking;

  const [input, setInput] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [trackingNum, setTrackingNum] = useState("");
  const [notFound, setNotFound] = useState(false);

  const handleTrack = () => {
    const key = input.trim().toUpperCase();
    const found = SHIPMENTS[key];
    if (found) {
      setShipment(found);
      setTrackingNum(key);
      setNotFound(false);
    } else {
      setShipment(null);
      setNotFound(true);
    }
  };

  const routePoints = useMemo(() =>
    shipment ? interpolate(shipment.oCoords, shipment.dCoords, 300) : [],
    [shipment]
  );

  const statusConfig = {
    preparing: { color: "amber", icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300" },
    transit: { color: "blue", icon: <Truck className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" },
    delivered: { color: "green", icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" },
  };

  const mapCenter: [number, number] = [47.5, 8];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-[#1a2e4a] dark:bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">{tx.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{tx.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Search box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6 transition-colors">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tx.inputLabel}</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              placeholder={tx.inputPh}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/40 dark:focus:ring-blue-500/40 transition"
            />
          </div>
          <button onClick={handleTrack}
            className="bg-[#1a2e4a] hover:bg-[#243d62] dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition text-sm flex items-center gap-2">
            <Search className="w-4 h-4" /> {tx.btn}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {tx.demo} <span className="font-mono text-[#1a2e4a] dark:text-blue-400 font-semibold">
            {Object.keys(SHIPMENTS).join(" · ")}
          </span>
        </p>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6 flex gap-3 items-center">
          <Search className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{tx.notFound}</p>
        </div>
      )}

      {shipment && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: status + details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tracking number */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Tracking #</p>
              <p className="font-mono font-bold text-xl text-[#1a2e4a] dark:text-blue-300">{trackingNum}</p>
            </div>

            {/* Status timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">{tx.statusLabel}</h2>
              <div className="space-y-1">
                {STATUS_STEPS.map((s, i) => {
                  const activeIdx = STATUS_STEPS.indexOf(shipment.status);
                  const isDone = i <= activeIdx;
                  const isActive = i === activeIdx;
                  return (
                    <div key={s}>
                      <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isActive ? statusConfig[s].bg
                          : isDone ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900"
                          : "bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                      } border`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isActive ? "bg-white dark:bg-slate-700 shadow-sm"
                            : isDone ? "bg-green-100 dark:bg-green-900/50"
                            : "bg-slate-200 dark:bg-slate-600"
                        }`}>
                          {isDone && !isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : statusConfig[s].icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isActive ? "" : isDone ? "text-green-700 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {tx.statuses[s]}
                          </p>
                          {isActive && (
                            <p className="text-xs opacity-75 mt-0.5">{tx.statusDesc[s]}</p>
                          )}
                        </div>
                        {isActive && shipment.status === "transit" && (
                          <Loader2 className="w-4 h-4 animate-spin opacity-60 flex-shrink-0" />
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`ml-6 w-0.5 h-3 ${i < activeIdx ? "bg-green-300 dark:bg-green-700" : "bg-slate-200 dark:bg-slate-700"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">{tx.details}</h2>
              <div className="space-y-3">
                {[
                  { icon: <MapPin className="w-4 h-4 text-green-500" />, label: tx.origin, val: shipment.origin },
                  { icon: <MapPin className="w-4 h-4 text-red-500" />, label: tx.destination, val: shipment.dest },
                  { icon: <User className="w-4 h-4 text-blue-500" />, label: tx.driver, val: shipment.driver },
                  { icon: <Package className="w-4 h-4 text-amber-500" />, label: tx.pallets, val: `${shipment.pallets} EUR pallets` },
                  { icon: <Calendar className="w-4 h-4 text-slate-400" />, label: tx.date, val: shipment.date },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Distance bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>{shipment.origin.split(",")[0]}</span>
                  <span className="font-semibold text-[#1a2e4a] dark:text-blue-300">{shipment.distKm} km</span>
                  <span>{shipment.dest.split(",")[0]}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 relative overflow-hidden">
                  <div className={`h-2 rounded-full transition-all duration-1000 ${
                    shipment.status === "delivered" ? "bg-green-500 w-full"
                      : shipment.status === "transit" ? "bg-blue-500 w-[55%]"
                      : "bg-amber-400 w-[5%]"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: animated map */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors h-full" style={{ minHeight: "500px" }}>
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tx.mapTitle}</span>
                {shipment.status === "transit" && (
                  <span className="flex items-center gap-1 text-xs text-blue-500 ml-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Live
                  </span>
                )}
                <span className="text-xs text-slate-400 ml-auto">{tx.mapCredit}</span>
              </div>
              <div style={{ height: "460px" }}>
                <MapContainer center={mapCenter} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {routePoints.length > 0 && (
                    <>
                      {/* Full route (dashed) */}
                      <Polyline positions={routePoints} color="#94a3b8" weight={2} dashArray="6 6" opacity={0.5} />
                      {/* Completed portion */}
                      <Polyline
                        positions={routePoints.slice(0, shipment.status === "delivered" ? routePoints.length : Math.floor(routePoints.length * 0.55))}
                        color="#1a2e4a" weight={4} opacity={0.85}
                      />
                      <FitRoute points={[routePoints[0], routePoints[routePoints.length - 1]]} />
                      {/* Origin marker */}
                      <Marker position={routePoints[0]}>
                        <Popup>📍 {shipment.origin}</Popup>
                      </Marker>
                      {/* Destination marker */}
                      <Marker position={routePoints[routePoints.length - 1]}>
                        <Popup>🏁 {shipment.dest}</Popup>
                      </Marker>
                      {/* Animated truck */}
                      <AnimatedTruck routePoints={routePoints} status={shipment.status} />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder when nothing searched yet */}
      {!shipment && !notFound && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center transition-colors">
          <div className="text-6xl mb-4">🚛</div>
          <h3 className="text-lg font-bold text-[#1a2e4a] dark:text-blue-300 mb-2">
            {lang === "en" ? "Enter a tracking number to get started" : "Entrez un numéro de suivi pour commencer"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            {lang === "en"
              ? "Try LT2025001 (in transit), LT2025002 (delivered), or LT2025003 (preparing)"
              : "Essayez LT2025001 (en transit), LT2025002 (livré), ou LT2025003 (en préparation)"}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {Object.keys(SHIPMENTS).map(k => (
              <button key={k} onClick={() => { setInput(k); }}
                className="font-mono text-xs bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[#1a2e4a] dark:text-blue-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 transition">
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
