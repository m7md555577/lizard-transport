import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Truck, Package, Star, Trophy, AlertTriangle, Clock, Fuel,
  TrendingUp, TrendingDown, CheckCircle, XCircle, Zap,
  Users, MapPin, ChevronRight, RefreshCw, Play, Award,
  CloudRain, Wind, ShieldAlert, Wrench, Timer, DollarSign
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = "Normal" | "Urgent" | "Express";
type MissionStatus = "pending" | "assigned" | "in-transit" | "delivered" | "failed";
type Difficulty = "easy" | "normal" | "hard" | "expert";
type View = "dashboard" | "missions" | "fleet" | "history";

interface Mission {
  id: string;
  customer: string;
  pickup: string;
  delivery: string;
  goods: string;
  pallets: number;
  weightKg: number;
  volumeM3: number;
  deadlineH: number;
  priority: Priority;
  distanceKm: number;
  rewardEur: number;
  status: MissionStatus;
  assignedTruckId?: string;
  rating?: number;
  earnedEur?: number;
  feedback?: string[];
  hoursToComplete?: number;
}

interface FleetTruck {
  id: string;
  plate: string;
  driver: string;
  location: string;
  maxWeightKg: number;
  maxPallets: number;
  fuelPct: number;
  available: boolean;
  drivingHoursToday: number;
  restHoursAvailable: number;
  weeklyHours: number;
  returnInH?: number;
}

interface GameEvent {
  id: string;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  icon: string;
  penaltyH: number;
  penaltyEur: number;
  options: { label: string; labelFr: string; resolve: "accept" | "workaround" }[];
}

interface AchievementDef {
  id: string;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  icon: string;
  check: (gs: GameSave) => boolean;
}

interface CompletedMission {
  mission: Mission;
  truckPlate: string;
  driver: string;
  rating: number;
  earnedEur: number;
  feedback: string[];
  day: number;
}

interface GameSave {
  difficulty: Difficulty;
  day: number;
  score: number;
  budget: number;
  missions: Mission[];
  fleet: FleetTruck[];
  history: CompletedMission[];
  unlockedAchievements: string[];
  missionsSent: number;
  perfectMissions: number;
  regulationViolations: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const MISSION_TEMPLATES: Omit<Mission, "id" | "status">[] = [
  { customer: "Renault Logistics", pickup: "Paris, France", delivery: "Lyon, France", goods: "Automotive parts", pallets: 12, weightKg: 8400, volumeM3: 22, deadlineH: 24, priority: "Urgent", distanceKm: 465, rewardEur: 1800 },
  { customer: "Carrefour SA", pickup: "Marseille, France", delivery: "Barcelona, Spain", goods: "Food & beverages", pallets: 20, weightKg: 14000, volumeM3: 40, deadlineH: 36, priority: "Normal", distanceKm: 320, rewardEur: 2200 },
  { customer: "BMW Group", pickup: "Munich, Germany", delivery: "Milan, Italy", goods: "Engine components", pallets: 8, weightKg: 12000, volumeM3: 18, deadlineH: 48, priority: "Express", distanceKm: 490, rewardEur: 3100 },
  { customer: "L'Oréal", pickup: "Lille, France", delivery: "Brussels, Belgium", goods: "Cosmetics", pallets: 5, weightKg: 2100, volumeM3: 12, deadlineH: 18, priority: "Normal", distanceKm: 115, rewardEur: 980 },
  { customer: "Michelin", pickup: "Clermont-Ferrand", delivery: "Madrid, Spain", goods: "Tyres", pallets: 24, weightKg: 18000, volumeM3: 48, deadlineH: 60, priority: "Normal", distanceKm: 1050, rewardEur: 3800 },
  { customer: "SNCF Logistics", pickup: "Bordeaux, France", delivery: "Toulouse, France", goods: "Electrical equipment", pallets: 16, weightKg: 9600, volumeM3: 30, deadlineH: 12, priority: "Express", distanceKm: 245, rewardEur: 2600 },
  { customer: "Ikea France", pickup: "Strasbourg, France", delivery: "Geneva, Switzerland", goods: "Flat-pack furniture", pallets: 33, weightKg: 22000, volumeM3: 82, deadlineH: 48, priority: "Normal", distanceKm: 185, rewardEur: 2900 },
  { customer: "Total Energies", pickup: "Le Havre, France", delivery: "Rotterdam, Netherlands", goods: "Lubricants", pallets: 10, weightKg: 15000, volumeM3: 20, deadlineH: 30, priority: "Urgent", distanceKm: 380, rewardEur: 2400 },
  { customer: "Airbus", pickup: "Toulouse, France", delivery: "Hamburg, Germany", goods: "Aerospace components", pallets: 6, weightKg: 4200, volumeM3: 14, deadlineH: 72, priority: "Express", distanceKm: 1280, rewardEur: 4200 },
  { customer: "Danone", pickup: "Paris, France", delivery: "Warsaw, Poland", goods: "Dairy products (refrigerated)", pallets: 18, weightKg: 13000, volumeM3: 36, deadlineH: 48, priority: "Urgent", distanceKm: 1420, rewardEur: 3600 },
  { customer: "Bouygues", pickup: "Nice, France", delivery: "Rome, Italy", goods: "Construction tools", pallets: 14, weightKg: 11200, volumeM3: 28, deadlineH: 36, priority: "Normal", distanceKm: 440, rewardEur: 2100 },
  { customer: "Société Générale", pickup: "Lyon, France", delivery: "Zurich, Switzerland", goods: "Banking equipment", pallets: 3, weightKg: 900, volumeM3: 6, deadlineH: 8, priority: "Express", distanceKm: 210, rewardEur: 1900 },
];

const FLEET_CONFIG: Omit<FleetTruck, "fuelPct" | "available" | "drivingHoursToday" | "weeklyHours">[] = [
  { id: "t1", plate: "FR-2847-AL", driver: "Jacques Moreau", location: "Paris, France", maxWeightKg: 24000, maxPallets: 33, restHoursAvailable: 11 },
  { id: "t2", plate: "FR-1193-BK", driver: "Pierre Lebrun", location: "Lyon, France", maxWeightKg: 24000, maxPallets: 33, restHoursAvailable: 11 },
  { id: "t3", plate: "FR-5562-DX", driver: "Marie Dupont", location: "Marseille, France", maxWeightKg: 18000, maxPallets: 22, restHoursAvailable: 11 },
  { id: "t4", plate: "FR-3301-GJ", driver: "Luc Bernard", location: "Bordeaux, France", maxWeightKg: 12000, maxPallets: 16, restHoursAvailable: 11 },
  { id: "t5", plate: "FR-7784-MT", driver: "Sophie Girard", location: "Strasbourg, France", maxWeightKg: 24000, maxPallets: 33, restHoursAvailable: 9 },
];

const RANDOM_EVENTS: GameEvent[] = [
  { id: "traffic", title: "Traffic Jam", titleFr: "Embouteillage", desc: "Major congestion on the A6 motorway. +2h delay expected.", descFr: "Congestion importante sur l'A6. +2h de retard prévu.", icon: "🚦", penaltyH: 2, penaltyEur: 0, options: [{ label: "Accept delay", labelFr: "Accepter le retard", resolve: "accept" }, { label: "Take alternate route (+€80)", labelFr: "Route alternative (+80€)", resolve: "workaround" }] },
  { id: "breakdown", title: "Vehicle Breakdown", titleFr: "Panne de véhicule", desc: "Truck has a mechanical failure. Awaiting roadside assistance.", descFr: "Panne mécanique du camion. Assistance routière en cours.", icon: "🔧", penaltyH: 4, penaltyEur: 350, options: [{ label: "Wait for repair (+4h, -€350)", labelFr: "Attendre réparation (+4h, -350€)", resolve: "accept" }, { label: "Send replacement truck (+€500)", labelFr: "Camion de remplacement (+500€)", resolve: "workaround" }] },
  { id: "weather", title: "Heavy Snow", titleFr: "Forte neige", desc: "Snowfall blocking alpine passes. Speed limited to 50 km/h.", descFr: "Chutes de neige bloquant les cols alpins. Vitesse limitée à 50 km/h.", icon: "❄️", penaltyH: 3, penaltyEur: 0, options: [{ label: "Slow down (+3h)", labelFr: "Ralentir (+3h)", resolve: "accept" }, { label: "Wait for clearance (+6h)", labelFr: "Attendre le déneigement (+6h)", resolve: "accept" }] },
  { id: "border", title: "Border Delay", titleFr: "Retard frontalier", desc: "Customs inspection taking longer than expected.", descFr: "Inspection douanière plus longue que prévue.", icon: "🛃", penaltyH: 2, penaltyEur: 0, options: [{ label: "Wait in queue (+2h)", labelFr: "Attendre en file (+2h)", resolve: "accept" }, { label: "Priority lane (+€120)", labelFr: "File prioritaire (+120€)", resolve: "workaround" }] },
  { id: "accident", title: "Road Accident", titleFr: "Accident de route", desc: "Accident ahead causing full closure of the motorway.", descFr: "Accident causant la fermeture de l'autoroute.", icon: "🚨", penaltyH: 3, penaltyEur: 0, options: [{ label: "Use secondary roads (+3h)", labelFr: "Routes secondaires (+3h)", resolve: "accept" }] },
  { id: "customer", title: "Customer Not Ready", titleFr: "Client non disponible", desc: "Delivery address is closed. No one available to receive goods.", descFr: "Adresse de livraison fermée. Personne disponible.", icon: "📦", penaltyH: 1, penaltyEur: 80, options: [{ label: "Wait 1h at delivery point", labelFr: "Attendre 1h sur place", resolve: "accept" }, { label: "Re-schedule (+€80 admin)", labelFr: "Reprogrammer (+80€)", resolve: "workaround" }] },
];

const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_delivery", title: "First Run", titleFr: "Premier trajet", desc: "Complete your first delivery", descFr: "Terminez votre première livraison", icon: "🚚", check: gs => gs.history.length >= 1 },
  { id: "perfect_planner", title: "Perfect Planner", titleFr: "Planificateur parfait", desc: "3 consecutive 5-star deliveries", descFr: "3 livraisons 5 étoiles consécutives", icon: "⭐", check: gs => gs.history.slice(-3).length === 3 && gs.history.slice(-3).every(h => h.rating === 5) },
  { id: "no_delay", title: "Always On Time", titleFr: "Toujours à l'heure", desc: "10 deliveries with no delay", descFr: "10 livraisons sans retard", icon: "⏱️", check: gs => gs.perfectMissions >= 10 },
  { id: "regulation_expert", title: "Regulation Expert", titleFr: "Expert réglementation", desc: "Complete 20 missions without violations", descFr: "20 missions sans infraction", icon: "📋", check: gs => gs.missionsSent >= 20 && gs.regulationViolations === 0 },
  { id: "profit_king", title: "Profit King", titleFr: "Roi du bénéfice", desc: "Earn over €50,000", descFr: "Gagner plus de 50 000€", icon: "👑", check: gs => gs.budget >= 50000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function makeFleet(): FleetTruck[] {
  return FLEET_CONFIG.map(f => ({
    ...f,
    fuelPct: 60 + Math.floor(Math.random() * 40),
    available: true,
    drivingHoursToday: Math.floor(Math.random() * 3),
    weeklyHours: 20 + Math.floor(Math.random() * 20),
    restHoursAvailable: f.restHoursAvailable,
  }));
}

function generateMissions(count: number, diff: Difficulty): Mission[] {
  const pool = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);
  const urgencyMult = { easy: 1.5, normal: 1, hard: 0.8, expert: 0.6 };
  return pool.map(t => ({
    ...t,
    id: uid(),
    status: "pending" as const,
    deadlineH: Math.round(t.deadlineH * urgencyMult[diff]),
  }));
}

function calcCost(mission: Mission, truck: FleetTruck): { fuel: number; tolls: number; driver: number; total: number } {
  const fuelPerKm = truck.maxWeightKg >= 20000 ? 0.38 : truck.maxWeightKg >= 12000 ? 0.32 : 0.26;
  const fuel = Math.round(mission.distanceKm * fuelPerKm);
  const tolls = Math.round(mission.distanceKm * 0.18);
  const hoursEst = mission.distanceKm / 75;
  const driver = Math.round(hoursEst * 18);
  return { fuel, tolls, driver, total: fuel + tolls + driver };
}

interface RegCheck { ok: boolean; violations: string[]; violationsFr: string[] }

function checkEURegulations(truck: FleetTruck, mission: Mission): RegCheck {
  const violations: string[] = [];
  const violationsFr: string[] = [];
  const driveH = mission.distanceKm / 75;
  if (truck.drivingHoursToday + driveH > 9) {
    violations.push("⚠️ Exceeds 9h daily driving limit");
    violationsFr.push("⚠️ Dépasse la limite journalière de 9h de conduite");
  }
  if (truck.weeklyHours + driveH > 56) {
    violations.push("⚠️ Exceeds 56h weekly driving limit");
    violationsFr.push("⚠️ Dépasse la limite hebdomadaire de 56h de conduite");
  }
  if (driveH > 4.5 && truck.restHoursAvailable < 0.75) {
    violations.push("⚠️ 45-min break required after 4.5h driving");
    violationsFr.push("⚠️ Pause 45min obligatoire après 4h30 de conduite");
  }
  if (truck.restHoursAvailable < 11) {
    violations.push("⚠️ Driver needs 11h daily rest before departure");
    violationsFr.push("⚠️ Le chauffeur doit bénéficier de 11h de repos journalier");
  }
  return { ok: violations.length === 0, violations, violationsFr };
}

function scoreTruckAssignment(mission: Mission, truck: FleetTruck): number {
  let score = 100;
  const weightCapacityPct = mission.weightKg / truck.maxWeightKg;
  const palletCapacityPct = mission.pallets / truck.maxPallets;
  if (weightCapacityPct > 1 || palletCapacityPct > 1) return 0;
  if (weightCapacityPct < 0.4) score -= 20;
  const reg = checkEURegulations(truck, mission);
  if (!reg.ok) score -= 30 * reg.violations.length;
  if (!truck.available) return 0;
  const driveH = mission.distanceKm / 75;
  if (driveH + 1 <= mission.deadlineH) score += 10;
  if (truck.fuelPct > 60) score += 5;
  return Math.max(0, Math.min(100, score));
}

function calcRating(mission: Mission, truck: FleetTruck, eventDelay: number, diff: Difficulty): { rating: number; feedback: string[]; feedbackFr: string[] } {
  const driveH = mission.distanceKm / 75 + eventDelay;
  const onTime = driveH <= mission.deadlineH;
  const reg = checkEURegulations(truck, mission);
  const cost = calcCost(mission, truck);
  const profit = mission.rewardEur - cost.total;
  const feedback: string[] = [];
  const feedbackFr: string[] = [];
  let rating = 5;

  if (!onTime) {
    const lateH = driveH - mission.deadlineH;
    const penalty = lateH > 6 ? 2 : 1;
    rating -= penalty;
    feedback.push(`❌ Delivered ${Math.round(lateH)}h late — plan tighter deadlines`);
    feedbackFr.push(`❌ Livraison en retard de ${Math.round(lateH)}h — planifiez mieux les délais`);
  } else {
    feedback.push("✅ Delivered on time — excellent planning!");
    feedbackFr.push("✅ Livraison dans les délais — excellente planification !");
  }

  if (!reg.ok) {
    rating -= reg.violations.length;
    feedback.push(...reg.violations.map(v => v + " — EU regulation penalty"));
    feedbackFr.push(...reg.violationsFr.map(v => v + " — pénalité réglementation UE"));
  } else {
    feedback.push("✅ EU driving regulations respected");
    feedbackFr.push("✅ Réglementation européenne respectée");
  }

  if (profit < 0) {
    rating -= 1;
    feedback.push(`❌ Mission ran at a loss (−€${Math.abs(profit)}) — optimize truck choice`);
    feedbackFr.push(`❌ Mission déficitaire (−${Math.abs(profit)}€) — optimisez le choix du camion`);
  } else {
    feedback.push(`✅ Profit: +€${profit} — good margin`);
    feedbackFr.push(`✅ Bénéfice : +${profit}€ — bonne marge`);
  }

  const diffBonus = { easy: 0, normal: 0, hard: 0, expert: 1 }[diff];
  rating = Math.max(1, Math.min(5, rating + diffBonus));

  return { rating, feedback, feedbackFr };
}

function initGame(diff: Difficulty): GameSave {
  return {
    difficulty: diff,
    day: 1,
    score: 0,
    budget: diff === "easy" ? 15000 : diff === "normal" ? 10000 : diff === "hard" ? 6000 : 3000,
    missions: generateMissions(diff === "easy" ? 4 : diff === "normal" ? 5 : diff === "hard" ? 6 : 7, diff),
    fleet: makeFleet(),
    history: [],
    unlockedAchievements: [],
    missionsSent: 0,
    perfectMissions: 0,
    regulationViolations: 0,
  };
}

const SAVE_KEY = "dispatch_save_v2";

function loadSave(): GameSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSave(gs: GameSave) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(gs)); } catch { /* noop */ }
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={14} className={i < n ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} />
      ))}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriBadge({ p }: { p: Priority }) {
  const cls = p === "Express" ? "bg-red-500/20 text-red-400 border-red-500/30"
    : p === "Urgent" ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
    : "bg-slate-500/20 text-slate-400 border-slate-500/30";
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cls}`}>{p}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DispatchSim() {
  const { lang } = useApp();
  const L = (en: string, fr: string) => lang === "fr" ? fr : en;

  const [gameState, setGameState] = useState<GameSave | null>(loadSave);
  const [view, setView] = useState<View>("dashboard");
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [pendingTruckId, setPendingTruckId] = useState<string | null>(null);
  const [resultMission, setResultMission] = useState<CompletedMission | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);

  useEffect(() => { if (gameState) saveSave(gameState); }, [gameState]);

  const checkAchievements = useCallback((gs: GameSave): AchievementDef[] => {
    const unlocked: AchievementDef[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!gs.unlockedAchievements.includes(a.id) && a.check(gs)) {
        unlocked.push(a);
      }
    }
    return unlocked;
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    const gs = initGame(diff);
    setGameState(gs);
    setView("dashboard");
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setGameState(null);
    setView("dashboard");
    setAssigningMissionId(null);
    setSelectedTruckId(null);
    setResultMission(null);
  }, []);

  const confirmAssignment = useCallback((missionId: string, truckId: string) => {
    if (!gameState) return;
    const mission = gameState.missions.find(m => m.id === missionId);
    const truck = gameState.fleet.find(t => t.id === truckId);
    if (!mission || !truck) return;

    const shouldEvent = Math.random() < (gameState.difficulty === "expert" ? 0.6 : gameState.difficulty === "hard" ? 0.4 : gameState.difficulty === "normal" ? 0.25 : 0.1);
    if (shouldEvent) {
      const ev = pickRandom(RANDOM_EVENTS);
      setPendingTruckId(truckId);
      setActiveEvent(ev);
      return;
    }
    finalizeAssignment(missionId, truckId, 0, 0);
  }, [gameState]);

  const finalizeAssignment = useCallback((missionId: string, truckId: string, eventDelayH: number, eventCostEur: number) => {
    if (!gameState) return;
    const mission = gameState.missions.find(m => m.id === missionId)!;
    const truck = gameState.fleet.find(t => t.id === truckId)!;
    const cost = calcCost(mission, truck);
    const { rating, feedback, feedbackFr } = calcRating(mission, truck, eventDelayH, gameState.difficulty);
    const earnedEur = Math.round(mission.rewardEur - cost.total - eventCostEur);
    const reg = checkEURegulations(truck, mission);
    const driveH = mission.distanceKm / 75;
    const isPerfect = rating === 5;

    const completed: CompletedMission = {
      mission: { ...mission, status: "delivered", assignedTruckId: truckId, rating, earnedEur, feedback: lang === "fr" ? feedbackFr : feedback },
      truckPlate: truck.plate,
      driver: truck.driver,
      rating,
      earnedEur,
      feedback: lang === "fr" ? feedbackFr : feedback,
      day: gameState.day,
    };

    const newGs: GameSave = {
      ...gameState,
      budget: gameState.budget + earnedEur,
      score: gameState.score + rating * 100 * (gameState.difficulty === "expert" ? 3 : gameState.difficulty === "hard" ? 2 : 1),
      missions: gameState.missions.map(m => m.id === missionId ? { ...m, status: "delivered" as const, rating, earnedEur } : m),
      fleet: gameState.fleet.map(t => t.id === truckId ? {
        ...t,
        drivingHoursToday: Math.min(9, t.drivingHoursToday + driveH),
        weeklyHours: t.weeklyHours + driveH,
        fuelPct: Math.max(10, t.fuelPct - Math.round(driveH * 8)),
        available: true,
      } : t),
      history: [...gameState.history, completed],
      missionsSent: gameState.missionsSent + 1,
      perfectMissions: gameState.perfectMissions + (isPerfect ? 1 : 0),
      regulationViolations: gameState.regulationViolations + (reg.ok ? 0 : reg.violations.length),
    };

    const newUnlocked = checkAchievements(newGs);
    newGs.unlockedAchievements = [...newGs.unlockedAchievements, ...newUnlocked.map(a => a.id)];
    newGs.day = newGs.missions.every(m => m.status !== "pending" && m.status !== "assigned")
      ? gameState.day + 1 : gameState.day;

    if (newGs.missions.every(m => m.status !== "pending" && m.status !== "assigned")) {
      const moreCount = newGs.difficulty === "easy" ? 3 : newGs.difficulty === "normal" ? 4 : newGs.difficulty === "hard" ? 5 : 6;
      newGs.missions = [...newGs.missions.map(m => m.status === "pending" ? { ...m, status: "failed" as const } : m),
        ...generateMissions(moreCount, newGs.difficulty)];
    }

    setGameState(newGs);
    setAssigningMissionId(null);
    setSelectedTruckId(null);
    setActiveEvent(null);
    setPendingTruckId(null);
    setResultMission(completed);
    if (newUnlocked.length > 0) setNewAchievements(newUnlocked);
  }, [gameState, checkAchievements, lang]);

  const resolveEvent = useCallback((resolve: "accept" | "workaround") => {
    if (!activeEvent || !assigningMissionId || !pendingTruckId) return;
    const delayH = resolve === "accept" ? activeEvent.penaltyH : Math.round(activeEvent.penaltyH * 0.3);
    const costEur = resolve === "workaround" ? activeEvent.penaltyEur + 80 : activeEvent.penaltyEur;
    setActiveEvent(null);
    finalizeAssignment(assigningMissionId, pendingTruckId, delayH, costEur);
  }, [activeEvent, assigningMissionId, pendingTruckId, finalizeAssignment]);

  // ── No game yet: start screen ───────────────────────────────────────────────
  if (!gameState) {
    return (
      <div className="min-h-[600px] bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6">
        <div className="text-6xl">🚛</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{L("Dispatch Manager", "Dispatch Manager")}</h2>
          <p className="text-slate-400 max-w-lg">{L("You are the Transport Operations Manager. Assign trucks, respect EU regulations, manage costs and deliver on time.", "Vous êtes le Responsable des Opérations de Transport. Assignez les camions, respectez la réglementation UE, gérez les coûts et livrez à temps.")}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
          {(["easy", "normal", "hard", "expert"] as Difficulty[]).map(d => {
            const labels = { easy: ["🟢 Easy", "🟢 Facile"], normal: ["🟡 Normal", "🟡 Normal"], hard: ["🔴 Hard", "🔴 Difficile"], expert: ["💀 Expert", "💀 Expert"] };
            const descs = { easy: ["More time, less events", "Plus de temps, moins d'aléas"], normal: ["Balanced challenge", "Défi équilibré"], hard: ["Tight deadlines, events", "Délais serrés, aléas fréquents"], expert: ["Extreme pressure", "Pression extrême"] };
            return (
              <button key={d} onClick={() => startGame(d)} className="bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl p-4 text-left transition-all group">
                <div className="font-bold text-white text-sm mb-1">{lang === "fr" ? labels[d][1] : labels[d][0]}</div>
                <div className="text-slate-400 group-hover:text-blue-200 text-xs">{lang === "fr" ? descs[d][1] : descs[d][0]}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const gs = gameState;
  const pendingMissions = gs.missions.filter(m => m.status === "pending");
  const activeTrucks = gs.fleet.filter(t => !t.available).length;
  const todayEarnings = gs.history.filter(h => h.day === gs.day).reduce((a, h) => a + h.earnedEur, 0);
  const avgRating = gs.history.length > 0 ? gs.history.reduce((a, h) => a + h.rating, 0) / gs.history.length : 0;
  const assigningMission = gs.missions.find(m => m.id === assigningMissionId);

  // ── Event modal ─────────────────────────────────────────────────────────────
  if (activeEvent) {
    return (
      <div className="min-h-[600px] bg-slate-900 rounded-2xl p-8 flex items-center justify-center">
        <div className="bg-slate-800 border border-orange-500/40 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">{activeEvent.icon}</div>
          <h3 className="text-xl font-bold text-orange-400 mb-2">{L(activeEvent.title, activeEvent.titleFr)}</h3>
          <p className="text-slate-300 mb-6">{L(activeEvent.desc, activeEvent.descFr)}</p>
          <div className="flex flex-col gap-3">
            {activeEvent.options.map(opt => (
              <button key={opt.resolve} onClick={() => resolveEvent(opt.resolve)}
                className="bg-slate-700 hover:bg-blue-600 border border-slate-600 hover:border-blue-500 rounded-xl px-5 py-3 text-white text-sm font-medium transition-all">
                {L(opt.label, opt.labelFr)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Result modal ─────────────────────────────────────────────────────────────
  if (resultMission) {
    return (
      <div className="min-h-[600px] bg-slate-900 rounded-2xl p-8 flex items-center justify-center">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-xl w-full">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{L("Mission Complete!", "Mission accomplie !")}</h3>
              <p className="text-slate-400 text-sm">{resultMission.mission.customer} — {resultMission.mission.delivery}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">{L("Rating", "Note")}</div>
              <Stars n={resultMission.rating} />
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">{L("Earnings", "Bénéfice")}</div>
              <div className={`font-bold text-sm ${resultMission.earnedEur >= 0 ? "text-green-400" : "text-red-400"}`}>
                {resultMission.earnedEur >= 0 ? "+" : ""}€{resultMission.earnedEur}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">{L("Score", "Score")}</div>
              <div className="font-bold text-blue-400 text-sm">+{resultMission.rating * 100}</div>
            </div>
          </div>
          <div className="mb-5">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-2">📚 {L("Learning", "Apprentissage")}</div>
            <div className="space-y-1.5">
              {resultMission.feedback.map((f, i) => (
                <div key={i} className="text-xs text-slate-300 bg-slate-700/30 rounded-lg px-3 py-2">{f}</div>
              ))}
            </div>
          </div>
          {newAchievements.length > 0 && (
            <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="text-xs font-bold text-yellow-400 mb-2">🏆 {L("Achievement Unlocked!", "Succès débloqué !")}</div>
              {newAchievements.map(a => (
                <div key={a.id} className="text-sm text-yellow-300">{a.icon} {L(a.title, a.titleFr)}</div>
              ))}
            </div>
          )}
          <button onClick={() => { setResultMission(null); setNewAchievements([]); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold transition-all">
            {L("Continue", "Continuer")} →
          </button>
        </div>
      </div>
    );
  }

  // ── Assignment panel ─────────────────────────────────────────────────────────
  if (assigningMissionId && assigningMission) {
    const cost = selectedTruckId ? calcCost(assigningMission, gs.fleet.find(t => t.id === selectedTruckId)!) : null;
    const selTruck = selectedTruckId ? gs.fleet.find(t => t.id === selectedTruckId) : null;
    const score = selTruck ? scoreTruckAssignment(assigningMission, selTruck) : null;
    const reg = selTruck ? checkEURegulations(selTruck, assigningMission) : null;

    return (
      <div className="bg-slate-900 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">🎯 {L("Assign Truck", "Assigner un camion")}</h3>
            <p className="text-slate-400 text-sm">{assigningMission.customer} → {assigningMission.delivery}</p>
          </div>
          <button onClick={() => { setAssigningMissionId(null); setSelectedTruckId(null); }} className="text-slate-400 hover:text-white text-sm border border-slate-700 rounded-lg px-3 py-1.5 transition-colors">✕ {L("Cancel", "Annuler")}</button>
        </div>

        {/* Mission summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: L("Pallets", "Palettes"), value: assigningMission.pallets, icon: "📦" },
            { label: L("Weight", "Poids"), value: `${(assigningMission.weightKg / 1000).toFixed(1)}t`, icon: "⚖️" },
            { label: L("Distance", "Distance"), value: `${assigningMission.distanceKm} km`, icon: "🛣️" },
            { label: L("Deadline", "Délai"), value: `${assigningMission.deadlineH}h`, icon: "⏰" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-white font-bold text-sm">{value}</div>
              <div className="text-slate-400 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Truck list */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase mb-3">{L("Available Trucks", "Camions disponibles")}</div>
          <div className="space-y-2">
            {gs.fleet.map(t => {
              const sc = scoreTruckAssignment(assigningMission, t);
              const canFit = t.maxWeightKg >= assigningMission.weightKg && t.maxPallets >= assigningMission.pallets;
              const isSelected = selectedTruckId === t.id;
              return (
                <button key={t.id} disabled={!t.available || !canFit}
                  onClick={() => setSelectedTruckId(isSelected ? null : t.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    !t.available || !canFit ? "opacity-40 cursor-not-allowed border-slate-700 bg-slate-800/50"
                    : isSelected ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-500"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🚛</div>
                      <div>
                        <div className="text-white font-semibold text-sm">{t.plate} — {t.driver}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <MapPin size={11} /> {t.location}
                          <span className="mx-1">·</span>
                          <Fuel size={11} /> {t.fuelPct}%
                          <span className="mx-1">·</span>
                          <Clock size={11} /> {t.drivingHoursToday.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${sc >= 80 ? "text-green-400" : sc >= 50 ? "text-yellow-400" : "text-red-400"}`}>{sc}%</div>
                      <div className="text-xs text-slate-400">{L("score", "score")}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <span className="bg-slate-700 rounded px-2 py-0.5 text-slate-300">{(t.maxWeightKg/1000).toFixed(0)}t max</span>
                    <span className="bg-slate-700 rounded px-2 py-0.5 text-slate-300">{t.maxPallets} {L("pal", "pal")}</span>
                    {!canFit && <span className="bg-red-500/20 text-red-400 rounded px-2 py-0.5">{L("Over capacity", "Capacité dépassée")}</span>}
                    {!t.available && <span className="bg-orange-500/20 text-orange-400 rounded px-2 py-0.5">{L("Unavailable", "Indisponible")}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost & regulation panel */}
        {selTruck && cost && reg && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-3">💰 {L("Cost Breakdown", "Détail des coûts")}</div>
              {[
                { label: L("Fuel", "Carburant"), val: cost.fuel },
                { label: L("Tolls", "Péages"), val: cost.tolls },
                { label: L("Driver", "Chauffeur"), val: cost.driver },
                { label: L("Total cost", "Coût total"), val: cost.total, bold: true },
                { label: L("Client pays", "Client paie"), val: assigningMission.rewardEur, bold: true, green: true },
                { label: L("Estimated profit", "Bénéfice estimé"), val: assigningMission.rewardEur - cost.total, bold: true, green: assigningMission.rewardEur - cost.total > 0 },
              ].map(({ label, val, bold, green }) => (
                <div key={label} className={`flex justify-between py-1 text-sm ${bold ? "border-t border-slate-700 mt-1 pt-2 font-semibold" : ""}`}>
                  <span className="text-slate-400">{label}</span>
                  <span className={green ? (val >= 0 ? "text-green-400" : "text-red-400") : "text-white"}>
                    {val < 0 ? "-" : ""}€{Math.abs(val)}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-3">📋 {L("EU Regulations", "Réglementations UE")}</div>
              {reg.ok
                ? <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={14} /> {L("All regulations respected", "Toutes les réglementations respectées")}</div>
                : (lang === "fr" ? reg.violationsFr : reg.violations).map((v, i) => (
                  <div key={i} className="flex items-start gap-2 text-orange-400 text-xs mb-2"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{v}</div>
                ))
              }
              <div className="mt-4 space-y-1 text-[11px] text-slate-500">
                <div>⏱ {L("4h30 max → 45min break", "4h30 max → 45min de pause")}</div>
                <div>🌙 {L("9h max daily driving", "9h max de conduite journalière")}</div>
                <div>📅 {L("56h max weekly", "56h max par semaine")}</div>
                <div>😴 {L("11h daily rest required", "11h de repos journalier requis")}</div>
              </div>
            </div>
          </div>
        )}

        {selTruck && (
          <button onClick={() => confirmAssignment(assigningMissionId, selectedTruckId!)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2">
            <Play size={16} />
            {L("Dispatch Mission", "Envoyer la mission")}
          </button>
        )}
      </div>
    );
  }

  // ── Main game UI ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">{L("Dispatch Manager", "Dispatch Manager")}</h2>
            <p className="text-slate-400 text-xs">{L(`Day ${gs.day} — ${gs.difficulty.charAt(0).toUpperCase() + gs.difficulty.slice(1)}`, `Jour ${gs.day} — ${gs.difficulty === "easy" ? "Facile" : gs.difficulty === "normal" ? "Normal" : gs.difficulty === "hard" ? "Difficile" : "Expert"}`)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-green-400 font-bold">€{gs.budget.toLocaleString()}</div>
            <div className="text-slate-400 text-xs">{L("Budget", "Budget")}</div>
          </div>
          <div className="text-right">
            <div className="text-blue-400 font-bold">{gs.score.toLocaleString()}</div>
            <div className="text-slate-400 text-xs">{L("Score", "Score")}</div>
          </div>
          <button onClick={resetGame} className="text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5">
            <RefreshCw size={12} /> {L("New Game", "Nouveau")}
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 divide-x divide-slate-700 border-b border-slate-700">
        {[
          { label: L("Pending", "En attente"), value: pendingMissions.length, icon: <Package size={14} />, color: "text-orange-400" },
          { label: L("Deliveries", "Livraisons"), value: gs.history.length, icon: <CheckCircle size={14} />, color: "text-green-400" },
          { label: L("Today +€", "Aujourd'hui +€"), value: todayEarnings.toLocaleString(), icon: <DollarSign size={14} />, color: "text-blue-400" },
          { label: L("Avg Rating", "Note moy."), value: avgRating > 0 ? avgRating.toFixed(1) : "—", icon: <Star size={14} />, color: "text-yellow-400" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="px-4 py-3 flex items-center gap-2">
            <span className={color}>{icon}</span>
            <div>
              <div className={`font-bold text-sm ${color}`}>{value}</div>
              <div className="text-slate-500 text-xs">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav tabs */}
      <div className="flex border-b border-slate-700">
        {([
          { id: "dashboard", label: L("Dashboard", "Tableau de bord"), icon: <TrendingUp size={13} /> },
          { id: "missions", label: L("Missions", "Missions"), icon: <Package size={13} />, badge: pendingMissions.length },
          { id: "fleet", label: L("Fleet", "Flotte"), icon: <Truck size={13} /> },
          { id: "history", label: L("History", "Historique"), icon: <Trophy size={13} /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as View)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 relative ${view === tab.id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"}`}>
            {tab.icon} {tab.label}
            {"badge" in tab && tab.badge > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Dashboard view */}
        {view === "dashboard" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pending missions preview */}
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">📦 {L("Pending Orders", "Commandes en attente")}</span>
                  <button onClick={() => setView("missions")} className="text-xs text-blue-400 hover:text-blue-300">{L("View all", "Voir tout")} →</button>
                </div>
                {pendingMissions.length === 0
                  ? <div className="text-slate-400 text-sm text-center py-4">{L("All missions dispatched!", "Toutes les missions sont envoyées !")}</div>
                  : pendingMissions.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
                      <div>
                        <div className="text-white text-sm font-medium flex items-center gap-2">{m.customer} <PriBadge p={m.priority} /></div>
                        <div className="text-slate-400 text-xs">{m.pickup} → {m.delivery}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 text-sm font-bold">€{m.rewardEur}</div>
                        <div className="text-orange-400 text-xs">{m.deadlineH}h</div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Fleet status */}
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">🚛 {L("Fleet Status", "État de la flotte")}</span>
                  <button onClick={() => setView("fleet")} className="text-xs text-blue-400 hover:text-blue-300">{L("Manage", "Gérer")} →</button>
                </div>
                {gs.fleet.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.available ? "bg-green-400" : "bg-orange-400"}`} />
                      <div>
                        <div className="text-white text-xs font-medium">{t.plate}</div>
                        <div className="text-slate-400 text-xs">{t.driver}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-400"><Fuel size={10} /> {t.fuelPct}%</div>
                        <div className="flex items-center gap-1 text-slate-400"><Clock size={10} /> {t.drivingHoursToday.toFixed(1)}h</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-3">🏆 {L("Achievements", "Succès")}</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = gs.unlockedAchievements.includes(a.id);
                  return (
                    <div key={a.id} className={`rounded-xl p-3 text-center transition-all ${unlocked ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/30 border border-slate-700 opacity-60"}`}>
                      <div className="text-2xl mb-1">{a.icon}</div>
                      <div className={`text-xs font-bold ${unlocked ? "text-yellow-400" : "text-slate-400"}`}>{L(a.title, a.titleFr)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{L(a.desc, a.descFr)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Missions view */}
        {view === "missions" && (
          <div className="space-y-3">
            <div className="text-sm text-slate-400 mb-2">{L("Click a pending mission to assign a truck.", "Cliquez sur une mission en attente pour assigner un camion.")}</div>
            {gs.missions.filter(m => m.status === "pending" || m.status === "delivered" || m.status === "failed").map(m => (
              <div key={m.id} className={`bg-slate-800 rounded-xl border transition-all ${m.status === "pending" ? "border-slate-700 hover:border-blue-500 cursor-pointer" : m.status === "delivered" ? "border-green-500/20" : "border-red-500/20"}`}
                onClick={() => m.status === "pending" && setAssigningMissionId(m.id)}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold text-sm">{m.customer}</span>
                        <PriBadge p={m.priority} />
                        {m.status === "delivered" && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-0.5 font-bold">✅ {L("DELIVERED", "LIVRÉ")}</span>}
                        {m.status === "failed" && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5 font-bold">❌ {L("FAILED", "ÉCHOUÉ")}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                        <MapPin size={11} /> {m.pickup}
                        <ChevronRight size={11} />
                        {m.delivery}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>📦 {m.pallets} {L("pal", "pal")} · ⚖️ {(m.weightKg/1000).toFixed(1)}t · 🛣️ {m.distanceKm}km · ⏰ {m.deadlineH}h</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">🏷️ {m.goods}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-green-400 font-bold">€{m.rewardEur}</div>
                      {m.status === "delivered" && m.rating != null && <Stars n={m.rating} />}
                      {m.status === "delivered" && m.earnedEur != null && (
                        <div className={`text-xs font-medium mt-1 ${m.earnedEur >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {m.earnedEur >= 0 ? "+" : ""}€{m.earnedEur} {L("profit", "bénéfice")}
                        </div>
                      )}
                      {m.status === "pending" && (
                        <div className="mt-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg px-3 py-1.5 hover:bg-blue-500 transition-colors">
                          {L("ASSIGN →", "ASSIGNER →")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fleet view */}
        {view === "fleet" && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400">{L("Fleet overview — EU regulations per driver.", "Vue de la flotte — réglementations UE par chauffeur.")}</div>
            {gs.fleet.map(t => {
              const weeklyPct = (t.weeklyHours / 56) * 100;
              const dailyPct = (t.drivingHoursToday / 9) * 100;
              return (
                <div key={t.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🚛</div>
                      <div>
                        <div className="text-white font-bold">{t.plate}</div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm"><Users size={12} />{t.driver}</div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5"><MapPin size={11} />{t.location}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${t.available ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30"}`}>
                        {t.available ? L("Available", "Disponible") : L("On mission", "En mission")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: L("Max Weight", "Poids max"), value: `${(t.maxWeightKg/1000).toFixed(0)}t` },
                      { label: L("Max Pallets", "Palettes max"), value: t.maxPallets },
                      { label: L("Fuel", "Carburant"), value: `${t.fuelPct}%` },
                      { label: L("Rest available", "Repos dispo"), value: `${t.restHoursAvailable}h` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                        <div className="text-white font-bold text-sm">{value}</div>
                        <div className="text-slate-400 text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>⏱ {L("Daily driving", "Conduite journalière")} ({t.drivingHoursToday.toFixed(1)}h / 9h)</span>
                        <span className={dailyPct > 80 ? "text-red-400" : "text-slate-400"}>{Math.round(dailyPct)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${dailyPct > 80 ? "bg-red-500" : dailyPct > 60 ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, dailyPct)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>📅 {L("Weekly hours", "Heures hebdomadaires")} ({t.weeklyHours.toFixed(0)}h / 56h)</span>
                        <span className={weeklyPct > 80 ? "text-red-400" : "text-slate-400"}>{Math.round(weeklyPct)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${weeklyPct > 80 ? "bg-red-500" : weeklyPct > 60 ? "bg-orange-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, weeklyPct)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* History view */}
        {view === "history" && (
          <div className="space-y-3">
            {gs.history.length === 0
              ? <div className="text-center py-12 text-slate-400">{L("No deliveries yet. Start dispatching missions!", "Aucune livraison. Commencez à envoyer des missions !")}</div>
              : [...gs.history].reverse().map((h, i) => (
                <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold text-sm mb-0.5">{h.mission.customer}</div>
                      <div className="text-slate-400 text-xs">{h.mission.pickup} → {h.mission.delivery}</div>
                      <div className="text-slate-500 text-xs mt-1">🚛 {h.truckPlate} — {h.driver} · {L(`Day ${h.day}`, `Jour ${h.day}`)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Stars n={h.rating} />
                      <div className={`text-sm font-bold mt-1 ${h.earnedEur >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {h.earnedEur >= 0 ? "+" : ""}€{h.earnedEur}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {h.feedback.slice(0, 2).map((f, j) => (
                      <div key={j} className="text-xs text-slate-400 bg-slate-700/30 rounded px-2.5 py-1">{f}</div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
