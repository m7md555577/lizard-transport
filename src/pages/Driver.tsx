import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Trash2, Navigation, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/translations";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const EU = {
  MAX_CONTINUOUS_DRIVE_MIN: 270,
  BREAK_DURATION_MIN: 45,
  MAX_DAILY_DRIVE_MIN: 540,
  MAX_DAILY_DRIVE_EXT_MIN: 600,
  DAILY_REST_MIN: 660,
  AVG_SPEED_KMH: 80,
};

interface Waypoint { address: string; coords: [number, number] | null }
interface RouteResult { distanceKm: number; drivingTimeMin: number; polyline: [number, number][]; waypoints: [number, number][] }
interface Block { type: string; durationMin: number; label: string; detail: string; dayNum: number; icon: string; color: string }
interface DayStats { day: number; drivenMin: number; blocks: Block[] }

async function geocode(address: string): Promise<[number, number]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr,en" } });
  const data = await res.json();
  if (!data?.length) throw new Error(`Address not found: "${address}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function calcRoute(points: [number, number][]): Promise<RouteResult> {
  const coords = points.map(([lat, lon]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found between these addresses");
  const route = data.routes[0];
  const polyline: [number, number][] = route.geometry.coordinates.map(([lon, lat]: number[]) => [lat, lon]);
  return { distanceKm: Math.round(route.distance / 1000), drivingTimeMin: Math.round(route.duration / 60), polyline, waypoints: points };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

function buildSchedule(totalDrivingMin: number): { days: DayStats[]; summary: string[] } {
  const days: DayStats[] = [];
  let remaining = totalDrivingMin, dayNum = 1, extUsed = 0;
  while (remaining > 0) {
    const blocks: Block[] = [];
    let dayDriven = 0, continuous = 0;
    const maxToday = extUsed < 2 && remaining > EU.MAX_DAILY_DRIVE_MIN ? EU.MAX_DAILY_DRIVE_EXT_MIN : EU.MAX_DAILY_DRIVE_MIN;
    while (remaining > 0 && dayDriven < maxToday) {
      const driveChunk = Math.min(remaining, EU.MAX_CONTINUOUS_DRIVE_MIN - continuous, maxToday - dayDriven);
      if (driveChunk <= 0) break;
      blocks.push({ type: "drive", durationMin: driveChunk, label: `Drive ${formatDuration(driveChunk)}`, detail: `~${Math.round(driveChunk / 60 * EU.AVG_SPEED_KMH)} km covered`, dayNum, icon: "🚛", color: "blue" });
      dayDriven += driveChunk; remaining -= driveChunk; continuous += driveChunk;
      if (remaining <= 0) break;
      if (continuous >= EU.MAX_CONTINUOUS_DRIVE_MIN && dayDriven < maxToday) {
        blocks.push({ type: "break", durationMin: EU.BREAK_DURATION_MIN, label: "Mandatory Break (45 min)", detail: "EU Reg. 561/2006 — required after 4h30 driving", dayNum, icon: "☕", color: "amber" });
        continuous = 0;
      }
    }
    if (remaining > 0) {
      if (dayDriven >= EU.MAX_DAILY_DRIVE_MIN) extUsed++;
      blocks.push({ type: "sleep", durationMin: EU.DAILY_REST_MIN, label: "Daily Rest — 11 hours", detail: "EU minimum daily rest period (Reg. 561/2006)", dayNum, icon: "🛏️", color: "purple" });
    }
    days.push({ day: dayNum, drivenMin: dayDriven, blocks });
    dayNum++;
  }
  const totalBreaks = days.flatMap(d => d.blocks).filter(b => b.type === "break").length;
  return {
    days,
    summary: [
      `Total driving: ${formatDuration(totalDrivingMin)}`,
      `Trip spans ${days.length} day(s)`,
      `EU max daily driving: 9h (10h ×2/week) ✓`,
      `Mandatory break every 4h30 ✓`,
      `11h daily rest enforced ✓`,
      ...(days.length > 1 ? [`${totalBreaks} mandatory break(s) planned`] : []),
    ],
  };
}

function buildTimeline(blocks: Block[], start: string) {
  const [h, m] = start.split(":").map(Number);
  let mins = h * 60 + m;
  return blocks.map(b => {
    const from = `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    mins += b.durationMin;
    const to = `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    return { ...b, from, to };
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (points.length >= 2) map.fitBounds(L.latLngBounds(points), { padding: [40, 40] }); }, [points, map]);
  return null;
}

const blockColor: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
  amber: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  purple: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
};

export default function Driver() {
  const { lang } = useApp();
  const tx = t[lang].driver;

  const [waypoints, setWaypoints] = useState<Waypoint[]>([{ address: "", coords: null }, { address: "", coords: null }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [schedule, setSchedule] = useState<{ days: DayStats[]; summary: string[] } | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [startTime, setStartTime] = useState("06:00");

  const addWaypoint = () => setWaypoints(wp => [...wp, { address: "", coords: null }]);
  const removeWaypoint = (i: number) => setWaypoints(wp => wp.filter((_, idx) => idx !== i));
  const updateAddress = (i: number, val: string) => setWaypoints(wp => wp.map((w, idx) => idx === i ? { ...w, address: val } : w));

  const handlePlan = async () => {
    const filled = waypoints.filter(w => w.address.trim());
    if (filled.length < 2) { setError(tx.errorMin); return; }
    setLoading(true); setError(null); setRoute(null); setSchedule(null);
    try {
      const coords = await Promise.all(filled.map(w => geocode(w.address.trim())));
      const result = await calcRoute(coords);
      setRoute(result);
      setSchedule(buildSchedule(result.drivingTimeMin));
      setActiveDay(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Route planning failed.");
    } finally {
      setLoading(false);
    }
  };

  const mapCenter: [number, number] = [46.5, 2.5];
  const allPolylinePoints = route?.polyline ?? [];

  const inp = "flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 dark:focus:ring-blue-500/40 transition";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1a2e4a] dark:bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🚛</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a] dark:text-blue-300">{tx.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{tx.subtitle}</p>
        </div>
      </div>

      {/* EU badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tx.badges.map(r => (
          <span key={r} className="text-xs bg-[#1a2e4a]/10 dark:bg-blue-900/40 text-[#1a2e4a] dark:text-blue-300 font-medium px-3 py-1 rounded-full border border-[#1a2e4a]/20 dark:border-blue-700">
            ✓ {r}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">{tx.routePlanner}</h2>
            <div className="space-y-3">
              {waypoints.map((wp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${i === 0 ? "bg-green-500" : i === waypoints.length - 1 ? "bg-red-500" : "bg-blue-400"}`}>
                    {i === 0 ? "A" : i === waypoints.length - 1 ? "Z" : String.fromCharCode(65 + i)}
                  </div>
                  <input type="text" value={wp.address} onChange={e => updateAddress(i, e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePlan()}
                    placeholder={i === 0 ? tx.pickupPh : i === waypoints.length - 1 ? tx.destPh : `${tx.stopPh} ${i}`}
                    className={inp} />
                  {waypoints.length > 2 && i > 0 && i < waypoints.length - 1 && (
                    <button onClick={() => removeWaypoint(i)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addWaypoint}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-[#1a2e4a] dark:hover:border-blue-500 hover:text-[#1a2e4a] dark:hover:text-blue-400 transition">
              <Plus className="w-3.5 h-3.5" /> {tx.addStop}
            </button>
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{tx.departureTime}</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 dark:focus:ring-blue-500/40" />
            </div>
            <button onClick={handlePlan} disabled={loading}
              className="mt-4 w-full bg-[#1a2e4a] hover:bg-[#243d62] dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{tx.planBtnLoading}</> : <><Navigation className="w-4 h-4" />{tx.planBtn}</>}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {route && schedule && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">{tx.summaryTitle}</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: tx.distLabel, val: String(route.distanceKm), sub: "km", color: "blue" },
                  { label: tx.pureDrive, val: formatDuration(route.drivingTimeMin), sub: tx.noBreaks, color: "slate" },
                  { label: tx.tripDays, val: String(schedule.days.length), sub: tx.inclRests, color: "amber" },
                  { label: tx.avgSpeed, val: String(EU.AVG_SPEED_KMH), sub: "km/h", color: "green" },
                ].map(({ label, val, sub, color }) => (
                  <div key={label} className={`bg-${color}-50 dark:bg-${color === "slate" ? "slate-700/50" : color + "-900/30"} border border-${color}-100 dark:border-${color}-800 rounded-xl p-3 text-center`}>
                    <p className={`text-xs text-${color}-500 font-semibold uppercase tracking-wide mb-1`}>{label}</p>
                    <p className={`text-2xl font-black text-${color}-700 dark:text-${color}-300`}>{val}</p>
                    <p className={`text-xs text-${color}-400`}>{sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">{tx.complianceTitle}</span>
                </div>
                {schedule.summary.map((s, i) => <p key={i} className="text-xs text-green-700 dark:text-green-400 py-0.5">• {s}</p>)}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tx.mapTitle}</span>
              <span className="text-xs text-slate-400 ml-auto">{tx.mapCredit}</span>
            </div>
            <div style={{ height: "400px" }}>
              <MapContainer center={mapCenter} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {allPolylinePoints.length > 0 && (<><Polyline positions={allPolylinePoints} color="#1a2e4a" weight={4} opacity={0.85} /><FitBounds points={allPolylinePoints} /></>)}
                {route?.waypoints.map(([lat, lon], i) => (
                  <Marker key={i} position={[lat, lon]}>
                    <Popup>{i === 0 ? "📍 " + tx.pickupPh.split(" ")[0] : i === route.waypoints.length - 1 ? "🏁 " + tx.destPh.split(" ")[0] : `🔵 ${tx.stopPh} ${i}`}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {schedule && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{tx.scheduleTitle}</h2>
                <div className="flex gap-1">
                  {schedule.days.map((_, i) => (
                    <button key={i} onClick={() => setActiveDay(i)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeDay === i ? "bg-[#1a2e4a] dark:bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
                      {tx.dayLabel} {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{tx.driving}</p>
                  <p className="font-bold text-[#1a2e4a] dark:text-blue-300 text-sm">{formatDuration(schedule.days[activeDay].drivenMin)}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{tx.maxAllowed}</p>
                  <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{formatDuration(EU.MAX_DAILY_DRIVE_MIN)}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">{tx.dailyUsage}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#1a2e4a] dark:bg-blue-500 transition-all"
                      style={{ width: `${Math.min(100, schedule.days[activeDay].drivenMin / EU.MAX_DAILY_DRIVE_MIN * 100)}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${schedule.days[activeDay].drivenMin <= EU.MAX_DAILY_DRIVE_MIN ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"}`}>
                  {Math.round(schedule.days[activeDay].drivenMin / EU.MAX_DAILY_DRIVE_MIN * 100)}%
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {buildTimeline(schedule.days[activeDay].blocks, startTime).map((block, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${blockColor[block.color]}`}>
                    <span className="text-lg flex-shrink-0">{block.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{block.label}</p>
                      <p className="text-xs opacity-70">{block.detail}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono font-bold">{block.from} → {block.to}</p>
                      <p className="text-xs opacity-60">{formatDuration(block.durationMin)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1a2e4a] dark:bg-slate-800 dark:border dark:border-slate-700 text-white rounded-2xl p-5 transition-colors">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-200 mb-3">{tx.euRefTitle}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {tx.euRules.map(({ icon, rule, val }) => (
                <div key={rule} className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <p className="text-xs text-blue-200 dark:text-blue-400">{rule}</p>
                    <p className="font-bold text-white">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
