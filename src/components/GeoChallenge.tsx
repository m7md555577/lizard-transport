import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import type { Layer, PathOptions, GeoJSONOptions } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trophy, Star, RefreshCw, Clock, CheckCircle, XCircle, Info, ChevronRight, BookOpen, Globe, Anchor } from "lucide-react";
import { useApp } from "@/context/AppContext";

// ─── Fix Leaflet icons ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegionInfo {
  code: string;
  name: string;
  name_fr: string;
  capital: string;
  cities: string;
  roads: string;
  logistics: string;
  ports: string;
  importance: string;
  importance_fr: string;
}

interface DeptInfo {
  code: string;
  name: string;
  prefecture: string;
  region: string;
}

interface GeoPoint {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type_en: string;
  type_fr: string;
  info_en: string;
  info_fr: string;
  img?: string;
  teu?: string;
  cargo?: string;
}

// ─── France Regions ───────────────────────────────────────────────────────────
const FRANCE_REGIONS: RegionInfo[] = [
  { code: "11", name: "Île-de-France", name_fr: "Île-de-France", capital: "Paris", cities: "Paris, Versailles, Boulogne-Billancourt, Nanterre", roads: "A1, A4, A6, A10, A13, A86, Périphérique", logistics: "Roissy CDG hub, Orly airport, Garonor, Sogaris logistics parks, Paris-Nord II", ports: "No sea port — serves Le Havre & Dunkirk via Seine/A13", importance: "France's economic heart. 30% of national GDP. Europe's largest logistics cluster at Roissy.", importance_fr: "Coeur économique. 30% du PIB national. Plus grand pôle logistique d'Europe à Roissy." },
  { code: "84", name: "Auvergne-Rhône-Alpes", name_fr: "Auvergne-Rhône-Alpes", capital: "Lyon", cities: "Lyon, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence", roads: "A6, A7, A43, A47, A48, A72, A75, A89", logistics: "Lyon-Eurexpo, Chesnes/Saint-Quentin-Fallavier, Bron, Corbas logistics zones", ports: "Inland port: Port de Lyon-Edouard Herriot (Rhône)", importance: "2nd largest French economy. Key transit axis between northern Europe and Mediterranean.", importance_fr: "2e économie française. Axe de transit clé entre l'Europe du Nord et la Méditerranée." },
  { code: "75", name: "Nouvelle-Aquitaine", name_fr: "Nouvelle-Aquitaine", capital: "Bordeaux", cities: "Bordeaux, Limoges, Poitiers, Pau, La Rochelle, Bayonne", roads: "A10, A63, A62, A89, N10, N141", logistics: "Bordeaux-Mérignac airport hub, Bloc-Logistique Bordeaux, La Winery logistics", ports: "Port de Bordeaux, Port de La Rochelle, Port de Bayonne", importance: "Largest French region by area. Atlantic gateway, wine exports, aerospace (Dassault).", importance_fr: "Plus grande région française. Porte atlantique, exportations viticoles, aérospatiale." },
  { code: "76", name: "Occitanie", name_fr: "Occitanie", capital: "Toulouse", cities: "Toulouse, Montpellier, Nîmes, Perpignan, Béziers, Albi", roads: "A9, A20, A61, A62, A66, A75", logistics: "Toulouse-Labège, Montpellier-Garosud, Port Vendres logistics", ports: "Port de Sète, Port de Port-Vendres", importance: "Airbus headquarters in Toulouse. Key corridor to Spain via A9/A61. Perpignan — busiest rail freight hub.", importance_fr: "Siège d'Airbus à Toulouse. Corridor clé vers l'Espagne. Perpignan — 1er hub fret ferroviaire." },
  { code: "32", name: "Hauts-de-France", name_fr: "Hauts-de-France", capital: "Lille", cities: "Lille, Amiens, Valenciennes, Dunkirk, Calais, Lens", roads: "A1, A2, A16, A25, A26, A29", logistics: "Dourges Delta 3 multimodal hub, Eurotunnel terminal, Calais-Coquelles logistics", ports: "Port de Dunkirk (3rd France), Port de Calais (Channel ferry hub)", importance: "Gateway between France, UK, Benelux. Channel Tunnel access. Busiest cross-Channel traffic.", importance_fr: "Porte d'entrée UE/UK. Tunnel sous la Manche. Trafic trans-Manche le plus dense." },
  { code: "28", name: "Normandie", name_fr: "Normandie", capital: "Rouen", cities: "Rouen, Caen, Le Havre, Cherbourg, Alençon, Évreux", roads: "A13, A28, A29, A84, A150", logistics: "Le Havre logistics zone, Port 2000, Vallée de la Seine multimodal", ports: "Port du Havre (1st France, 5th Europe), Port de Rouen (agricultural), Port de Caen-Ouistreham", importance: "Le Havre is France's main container port. Seine axis connects to Paris and beyond.", importance_fr: "Le Havre est le 1er port conteneurs de France. L'axe Seine relie Paris et l'hinterland." },
  { code: "44", name: "Grand Est", name_fr: "Grand Est", capital: "Strasbourg", cities: "Strasbourg, Reims, Metz, Mulhouse, Nancy, Colmar", roads: "A4, A31, A35, A36, A26, E25", logistics: "Strasbourg port (Rhine), Metz-Mercy logistics, Reims logistics park", ports: "Port Autonome de Strasbourg (2nd largest river port in Europe)", importance: "Borders Germany, Luxembourg, Switzerland, Belgium. Key Rhine corridor for Rhine-Main-Danube.", importance_fr: "Frontières DE/LU/CH/BE. Corridor Rhin stratégique. Port de Strasbourg — 2e port fluvial UE." },
  { code: "52", name: "Pays de la Loire", name_fr: "Pays de la Loire", capital: "Nantes", cities: "Nantes, Angers, Le Mans, Saint-Nazaire, Laval", roads: "A11, A83, A85, A87, N157, N165", logistics: "Nantes-Saint-Nazaire logistics, Saint-Herblain, Carquefou distribution center", ports: "Port de Nantes-Saint-Nazaire (4th France, Atlantic gateway)", importance: "Airbus assembly in Saint-Nazaire. Atlantic façade. Major food processing exports.", importance_fr: "Assemblage Airbus à Saint-Nazaire. Façade atlantique. Exportations agroalimentaires majeures." },
  { code: "53", name: "Bretagne", name_fr: "Bretagne", capital: "Rennes", cities: "Rennes, Brest, Quimper, Lorient, Saint-Malo, Vannes", roads: "N12, N165, A81, N24, N166", logistics: "Rennes logistics hub, Brest strategic port, Saint-Malo ferry terminal", ports: "Port de Brest (military/commercial), Port de Saint-Malo (ferry UK), Port de Lorient", importance: "Western peninsula endpoint. Ferry routes to UK and Ireland. Agri-food exports (pork, dairy).", importance_fr: "Extrémité de la péninsule. Ferries UK/Irlande. Exportations agro-alimentaires (porc, lait)." },
  { code: "24", name: "Centre-Val de Loire", name_fr: "Centre-Val de Loire", capital: "Orléans", cities: "Orléans, Tours, Bourges, Chartres, Blois, Châteauroux", roads: "A10, A11, A71, A85, N20", logistics: "Orléans-Bricy logistics, Tours-Saint-Pierre logistics park, Amazon/XPO hubs", ports: "No major sea port. Loire river (limited navigation)", importance: "Central location. Major logistics hub for distribution to whole France. Pivotal crossroads.", importance_fr: "Position centrale. Hub logistique majeur pour la distribution nationale. Carrefour stratégique." },
  { code: "27", name: "Bourgogne-Franche-Comté", name_fr: "Bourgogne-Franche-Comté", capital: "Dijon", cities: "Dijon, Besançon, Chalon-sur-Saône, Auxerre, Belfort, Montbéliard", roads: "A6, A31, A36, A38, A39", logistics: "Dijon Bourgogne (DB) multimodal terminal, Chalon logistics park, PSA/Stellantis Sochaux", ports: "Port de Chalon-sur-Saône (Saône), port de Dijon (canal)", importance: "Key north-south axis between Paris and Lyon. Rhine-Rhône canal connection. Stellantis cars.", importance_fr: "Axe nord-sud Paris–Lyon. Canal Rhin-Rhône. Usines automobiles Stellantis." },
  { code: "93", name: "Provence-Alpes-Côte d'Azur", name_fr: "Provence-Alpes-Côte d'Azur", capital: "Marseille", cities: "Marseille, Nice, Toulon, Aix-en-Provence, Cannes, Avignon", roads: "A7, A8, A50, A51, A52, A57", logistics: "Marseille-Fos logistics zone, Miramas rail hub, Nice airport cargo", ports: "Port de Marseille-Fos (1st France by tonnage, 2nd Mediterranean)", importance: "Marseille-Fos is France's largest port and key Mediterranean gateway to the Middle East and Asia.", importance_fr: "Marseille-Fos est le 1er port français en tonnage et porte méditerranéenne vers l'Asie." },
  { code: "94", name: "Corse", name_fr: "Corse", capital: "Ajaccio", cities: "Ajaccio, Bastia, Porto-Vecchio, Calvi, Bonifacio", roads: "N193, N196, N198 (main island roads)", logistics: "Limited logistics infrastructure. Ferry-dependent supply chain.", ports: "Port de Bastia, Port d'Ajaccio (main ferry ports to continent)", importance: "Island region. Entirely dependent on maritime and air transport. Growing tourism logistics.", importance_fr: "Région insulaire. Dépendante du transport maritime et aérien. Logistique touristique croissante." },
];

// ─── France Departments (all 96 metropolitan + 5 overseas) ───────────────────
const FRANCE_DEPTS: DeptInfo[] = [
  { code: "01", name: "Ain", prefecture: "Bourg-en-Bresse", region: "Auvergne-Rhône-Alpes" },
  { code: "02", name: "Aisne", prefecture: "Laon", region: "Hauts-de-France" },
  { code: "03", name: "Allier", prefecture: "Moulins", region: "Auvergne-Rhône-Alpes" },
  { code: "04", name: "Alpes-de-Haute-Provence", prefecture: "Digne-les-Bains", region: "Provence-Alpes-Côte d'Azur" },
  { code: "05", name: "Hautes-Alpes", prefecture: "Gap", region: "Provence-Alpes-Côte d'Azur" },
  { code: "06", name: "Alpes-Maritimes", prefecture: "Nice", region: "Provence-Alpes-Côte d'Azur" },
  { code: "07", name: "Ardèche", prefecture: "Privas", region: "Auvergne-Rhône-Alpes" },
  { code: "08", name: "Ardennes", prefecture: "Charleville-Mézières", region: "Grand Est" },
  { code: "09", name: "Ariège", prefecture: "Foix", region: "Occitanie" },
  { code: "10", name: "Aube", prefecture: "Troyes", region: "Grand Est" },
  { code: "11", name: "Aude", prefecture: "Carcassonne", region: "Occitanie" },
  { code: "12", name: "Aveyron", prefecture: "Rodez", region: "Occitanie" },
  { code: "13", name: "Bouches-du-Rhône", prefecture: "Marseille", region: "Provence-Alpes-Côte d'Azur" },
  { code: "14", name: "Calvados", prefecture: "Caen", region: "Normandie" },
  { code: "15", name: "Cantal", prefecture: "Aurillac", region: "Auvergne-Rhône-Alpes" },
  { code: "16", name: "Charente", prefecture: "Angoulême", region: "Nouvelle-Aquitaine" },
  { code: "17", name: "Charente-Maritime", prefecture: "La Rochelle", region: "Nouvelle-Aquitaine" },
  { code: "18", name: "Cher", prefecture: "Bourges", region: "Centre-Val de Loire" },
  { code: "19", name: "Corrèze", prefecture: "Tulle", region: "Nouvelle-Aquitaine" },
  { code: "2A", name: "Corse-du-Sud", prefecture: "Ajaccio", region: "Corse" },
  { code: "2B", name: "Haute-Corse", prefecture: "Bastia", region: "Corse" },
  { code: "21", name: "Côte-d'Or", prefecture: "Dijon", region: "Bourgogne-Franche-Comté" },
  { code: "22", name: "Côtes-d'Armor", prefecture: "Saint-Brieuc", region: "Bretagne" },
  { code: "23", name: "Creuse", prefecture: "Guéret", region: "Nouvelle-Aquitaine" },
  { code: "24", name: "Dordogne", prefecture: "Périgueux", region: "Nouvelle-Aquitaine" },
  { code: "25", name: "Doubs", prefecture: "Besançon", region: "Bourgogne-Franche-Comté" },
  { code: "26", name: "Drôme", prefecture: "Valence", region: "Auvergne-Rhône-Alpes" },
  { code: "27", name: "Eure", prefecture: "Évreux", region: "Normandie" },
  { code: "28", name: "Eure-et-Loir", prefecture: "Chartres", region: "Centre-Val de Loire" },
  { code: "29", name: "Finistère", prefecture: "Quimper", region: "Bretagne" },
  { code: "30", name: "Gard", prefecture: "Nîmes", region: "Occitanie" },
  { code: "31", name: "Haute-Garonne", prefecture: "Toulouse", region: "Occitanie" },
  { code: "32", name: "Gers", prefecture: "Auch", region: "Occitanie" },
  { code: "33", name: "Gironde", prefecture: "Bordeaux", region: "Nouvelle-Aquitaine" },
  { code: "34", name: "Hérault", prefecture: "Montpellier", region: "Occitanie" },
  { code: "35", name: "Ille-et-Vilaine", prefecture: "Rennes", region: "Bretagne" },
  { code: "36", name: "Indre", prefecture: "Châteauroux", region: "Centre-Val de Loire" },
  { code: "37", name: "Indre-et-Loire", prefecture: "Tours", region: "Centre-Val de Loire" },
  { code: "38", name: "Isère", prefecture: "Grenoble", region: "Auvergne-Rhône-Alpes" },
  { code: "39", name: "Jura", prefecture: "Lons-le-Saunier", region: "Bourgogne-Franche-Comté" },
  { code: "40", name: "Landes", prefecture: "Mont-de-Marsan", region: "Nouvelle-Aquitaine" },
  { code: "41", name: "Loir-et-Cher", prefecture: "Blois", region: "Centre-Val de Loire" },
  { code: "42", name: "Loire", prefecture: "Saint-Étienne", region: "Auvergne-Rhône-Alpes" },
  { code: "43", name: "Haute-Loire", prefecture: "Le Puy-en-Velay", region: "Auvergne-Rhône-Alpes" },
  { code: "44", name: "Loire-Atlantique", prefecture: "Nantes", region: "Pays de la Loire" },
  { code: "45", name: "Loiret", prefecture: "Orléans", region: "Centre-Val de Loire" },
  { code: "46", name: "Lot", prefecture: "Cahors", region: "Occitanie" },
  { code: "47", name: "Lot-et-Garonne", prefecture: "Agen", region: "Nouvelle-Aquitaine" },
  { code: "48", name: "Lozère", prefecture: "Mende", region: "Occitanie" },
  { code: "49", name: "Maine-et-Loire", prefecture: "Angers", region: "Pays de la Loire" },
  { code: "50", name: "Manche", prefecture: "Saint-Lô", region: "Normandie" },
  { code: "51", name: "Marne", prefecture: "Châlons-en-Champagne", region: "Grand Est" },
  { code: "52", name: "Haute-Marne", prefecture: "Chaumont", region: "Grand Est" },
  { code: "53", name: "Mayenne", prefecture: "Laval", region: "Pays de la Loire" },
  { code: "54", name: "Meurthe-et-Moselle", prefecture: "Nancy", region: "Grand Est" },
  { code: "55", name: "Meuse", prefecture: "Bar-le-Duc", region: "Grand Est" },
  { code: "56", name: "Morbihan", prefecture: "Vannes", region: "Bretagne" },
  { code: "57", name: "Moselle", prefecture: "Metz", region: "Grand Est" },
  { code: "58", name: "Nièvre", prefecture: "Nevers", region: "Bourgogne-Franche-Comté" },
  { code: "59", name: "Nord", prefecture: "Lille", region: "Hauts-de-France" },
  { code: "60", name: "Oise", prefecture: "Beauvais", region: "Hauts-de-France" },
  { code: "61", name: "Orne", prefecture: "Alençon", region: "Normandie" },
  { code: "62", name: "Pas-de-Calais", prefecture: "Arras", region: "Hauts-de-France" },
  { code: "63", name: "Puy-de-Dôme", prefecture: "Clermont-Ferrand", region: "Auvergne-Rhône-Alpes" },
  { code: "64", name: "Pyrénées-Atlantiques", prefecture: "Pau", region: "Nouvelle-Aquitaine" },
  { code: "65", name: "Hautes-Pyrénées", prefecture: "Tarbes", region: "Occitanie" },
  { code: "66", name: "Pyrénées-Orientales", prefecture: "Perpignan", region: "Occitanie" },
  { code: "67", name: "Bas-Rhin", prefecture: "Strasbourg", region: "Grand Est" },
  { code: "68", name: "Haut-Rhin", prefecture: "Colmar", region: "Grand Est" },
  { code: "69", name: "Rhône", prefecture: "Lyon", region: "Auvergne-Rhône-Alpes" },
  { code: "70", name: "Haute-Saône", prefecture: "Vesoul", region: "Bourgogne-Franche-Comté" },
  { code: "71", name: "Saône-et-Loire", prefecture: "Mâcon", region: "Bourgogne-Franche-Comté" },
  { code: "72", name: "Sarthe", prefecture: "Le Mans", region: "Pays de la Loire" },
  { code: "73", name: "Savoie", prefecture: "Chambéry", region: "Auvergne-Rhône-Alpes" },
  { code: "74", name: "Haute-Savoie", prefecture: "Annecy", region: "Auvergne-Rhône-Alpes" },
  { code: "75", name: "Paris", prefecture: "Paris", region: "Île-de-France" },
  { code: "76", name: "Seine-Maritime", prefecture: "Rouen", region: "Normandie" },
  { code: "77", name: "Seine-et-Marne", prefecture: "Melun", region: "Île-de-France" },
  { code: "78", name: "Yvelines", prefecture: "Versailles", region: "Île-de-France" },
  { code: "79", name: "Deux-Sèvres", prefecture: "Niort", region: "Nouvelle-Aquitaine" },
  { code: "80", name: "Somme", prefecture: "Amiens", region: "Hauts-de-France" },
  { code: "81", name: "Tarn", prefecture: "Albi", region: "Occitanie" },
  { code: "82", name: "Tarn-et-Garonne", prefecture: "Montauban", region: "Occitanie" },
  { code: "83", name: "Var", prefecture: "Toulon", region: "Provence-Alpes-Côte d'Azur" },
  { code: "84", name: "Vaucluse", prefecture: "Avignon", region: "Provence-Alpes-Côte d'Azur" },
  { code: "85", name: "Vendée", prefecture: "La Roche-sur-Yon", region: "Pays de la Loire" },
  { code: "86", name: "Vienne", prefecture: "Poitiers", region: "Nouvelle-Aquitaine" },
  { code: "87", name: "Haute-Vienne", prefecture: "Limoges", region: "Nouvelle-Aquitaine" },
  { code: "88", name: "Vosges", prefecture: "Épinal", region: "Grand Est" },
  { code: "89", name: "Yonne", prefecture: "Auxerre", region: "Bourgogne-Franche-Comté" },
  { code: "90", name: "Territoire de Belfort", prefecture: "Belfort", region: "Bourgogne-Franche-Comté" },
  { code: "91", name: "Essonne", prefecture: "Évry-Courcouronnes", region: "Île-de-France" },
  { code: "92", name: "Hauts-de-Seine", prefecture: "Nanterre", region: "Île-de-France" },
  { code: "93", name: "Seine-Saint-Denis", prefecture: "Bobigny", region: "Île-de-France" },
  { code: "94", name: "Val-de-Marne", prefecture: "Créteil", region: "Île-de-France" },
  { code: "95", name: "Val-d'Oise", prefecture: "Cergy-Pontoise", region: "Île-de-France" },
  { code: "971", name: "Guadeloupe", prefecture: "Basse-Terre", region: "Overseas" },
  { code: "972", name: "Martinique", prefecture: "Fort-de-France", region: "Overseas" },
  { code: "973", name: "Guyane", prefecture: "Cayenne", region: "Overseas" },
  { code: "974", name: "La Réunion", prefecture: "Saint-Denis", region: "Overseas" },
  { code: "976", name: "Mayotte", prefecture: "Mamoudzou", region: "Overseas" },
];

// ─── World Ports ──────────────────────────────────────────────────────────────
const WORLD_PORTS: GeoPoint[] = [
  // Europe
  { id: "rtt", name: "Rotterdam", country: "Netherlands", lat: 51.9167, lng: 4.5, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Europe's largest port. 14.5M TEU/year. Gateway for German, Swiss and Eastern European hinterland. Rhine river connection.", info_fr: "Plus grand port d'Europe. 14,5M EVP/an. Porte d'entrée pour l'hinterland allemand et est-européen. Connexion fluviale au Rhin.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Port_of_Rotterdam_%2842157083511%29.jpg/320px-Port_of_Rotterdam_%2842157083511%29.jpg", teu: "14.5M TEU", cargo: "Containers, oil, chemicals, bulk" },
  { id: "ant", name: "Antwerp-Bruges", country: "Belgium", lat: 51.25, lng: 4.27, type_en: "Container & Multipurpose", type_fr: "Conteneurs & Multifonction", info_en: "2nd largest European port. 13.5M TEU. World's largest chemical cluster. Connected to Rhine, Meuse, Scheldt.", info_fr: "2e port européen. 13,5M EVP. Plus grand cluster chimique mondial. Connexion Rhin, Meuse, Escaut.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Luchtfoto_haven_Antwerpen.jpg/320px-Luchtfoto_haven_Antwerpen.jpg", teu: "13.5M TEU", cargo: "Containers, chemicals, vehicles" },
  { id: "ham", name: "Hamburg", country: "Germany", lat: 53.54, lng: 9.99, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Germany's largest port. 8.9M TEU. Gateway for Central and Eastern Europe. Elbe river access.", info_fr: "Plus grand port allemand. 8,9M EVP. Porte d'entrée Europe centrale et orientale. Accès fluvial via l'Elbe.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Containerhafen_Hamburg.jpg/320px-Containerhafen_Hamburg.jpg", teu: "8.9M TEU", cargo: "Containers, bulk, Ro-Ro" },
  { id: "lhv", name: "Le Havre", country: "France", lat: 49.49, lng: 0.11, type_en: "Container & Oil", type_fr: "Conteneurs & Pétrole", info_en: "France's #1 container port. Port 2000 terminal. Serves Paris region and Seine valley. 2.9M TEU.", info_fr: "1er port conteneurs de France. Terminal Port 2000. Dessert Paris et la vallée de la Seine. 2,9M EVP.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Port_du_Havre_-_porte_oce%CC%81ane_de_Paris.jpg/320px-Port_du_Havre_-_porte_oce%CC%81ane_de_Paris.jpg", teu: "2.9M TEU", cargo: "Containers, oil, chemicals" },
  { id: "mfos", name: "Marseille-Fos", country: "France", lat: 43.34, lng: 4.92, type_en: "Oil & Container", type_fr: "Pétrole & Conteneurs", info_en: "France's largest port by tonnage (80M t/year). Mediterranean gateway. Fos-sur-Mer industrial zone.", info_fr: "1er port français en tonnage (80M t/an). Porte méditerranéenne. Zone industrielle de Fos-sur-Mer.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Port_de_Marseille_Fos.jpg/320px-Port_de_Marseille_Fos.jpg", teu: "1.5M TEU", cargo: "Oil, containers, bulk, gas" },
  { id: "vlc", name: "Valencia", country: "Spain", lat: 39.44, lng: -0.31, type_en: "Container", type_fr: "Conteneurs", info_en: "5th largest European port. 5.4M TEU. Leading container port on the Mediterranean. Gateway to Iberian Peninsula.", info_fr: "5e port européen. 5,4M EVP. Principal port conteneurs de Méditerranée. Porte de la péninsule ibérique.", img: "", teu: "5.4M TEU", cargo: "Containers, vehicles, bulk" },
  { id: "bcn", name: "Barcelona", country: "Spain", lat: 41.34, lng: 2.17, type_en: "Container & Cruise", type_fr: "Conteneurs & Croisières", info_en: "Major Spanish port. 3.5M TEU. Important cruise terminal. Southern European logistics hub.", info_fr: "Port espagnol majeur. 3,5M EVP. Important terminal de croisières. Hub logistique du sud de l'Europe.", img: "", teu: "3.5M TEU", cargo: "Containers, cruise, bulk" },
  { id: "gen", name: "Genoa", country: "Italy", lat: 44.41, lng: 8.92, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Italy's busiest port. 2.7M TEU. Gateway to northern Italy and Switzerland. Rail connection to Alpine countries.", info_fr: "Port le plus actif d'Italie. 2,7M EVP. Porte d'entrée vers l'Italie du Nord et la Suisse.", img: "", teu: "2.7M TEU", cargo: "Containers, bulk, Ro-Ro" },
  { id: "trs", name: "Trieste", country: "Italy", lat: 45.65, lng: 13.77, type_en: "Oil & Container", type_fr: "Pétrole & Conteneurs", info_en: "Italy's first port by tonnage. 64M t/year. Trans-European pipeline terminus. Gateway to Central Europe.", info_fr: "1er port italien en tonnage. 64M t/an. Terminus du pipeline transeuropéen. Porte de l'Europe centrale.", img: "", teu: "0.8M TEU", cargo: "Oil, containers, bulk" },
  { id: "pir", name: "Piraeus", country: "Greece", lat: 37.94, lng: 23.65, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Greece's main port. 5.6M TEU. Operated by COSCO (China). Fastest growing European port. SE Europe gateway.", info_fr: "Principal port grec. 5,6M EVP. Opéré par COSCO (Chine). Croissance la plus rapide d'Europe.", img: "", teu: "5.6M TEU", cargo: "Containers, bulk, cruise" },
  // Asia
  { id: "sha", name: "Shanghai", country: "China", lat: 31.18, lng: 121.68, type_en: "Container", type_fr: "Conteneurs", info_en: "World's busiest port. 47.3M TEU/year. Yangshan deepwater terminal. Handles ~40% of China's exports.", info_fr: "Port le plus fréquenté au monde. 47,3M EVP/an. Terminal en eau profonde de Yangshan.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Yangshan_Port_Aerial.jpg/320px-Yangshan_Port_Aerial.jpg", teu: "47.3M TEU", cargo: "Containers, electronics, manufacturing" },
  { id: "sgp", name: "Singapore", country: "Singapore", lat: 1.27, lng: 103.82, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "World's 2nd busiest port. 37.5M TEU. Largest transshipment hub in Asia. Tuas Mega Port under development.", info_fr: "2e port mondial. 37,5M EVP. Plus grand hub de transbordement en Asie.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Singapore_port.jpg/320px-Singapore_port.jpg", teu: "37.5M TEU", cargo: "Containers, oil, transshipment" },
  { id: "szn", name: "Shenzhen", country: "China", lat: 22.5, lng: 114.1, type_en: "Container", type_fr: "Conteneurs", info_en: "3rd busiest port worldwide. 30M TEU. Adjacent to Hong Kong. Major electronics and manufacturing export hub.", info_fr: "3e port mondial. 30M EVP. Adjacent à Hong Kong. Hub d'exportation d'électronique et de manufacturing.", img: "", teu: "30M TEU", cargo: "Electronics, manufactured goods" },
  { id: "nzs", name: "Ningbo-Zhoushan", country: "China", lat: 29.87, lng: 121.87, type_en: "Container & Bulk", type_fr: "Conteneurs & Vrac", info_en: "World's 3rd port by tonnage. 33.4M TEU. Beilun terminal. Major iron ore and oil terminal.", info_fr: "3e port mondial en tonnage. 33,4M EVP. Terminal de Beilun. Major terminal minerai/pétrole.", img: "", teu: "33.4M TEU", cargo: "Containers, ore, oil, coal" },
  { id: "bus", name: "Busan", country: "South Korea", lat: 35.1, lng: 129.04, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "Korea's largest port. 22.1M TEU. 6th worldwide. Key transshipment hub for Northeast Asia.", info_fr: "Plus grand port coréen. 22,1M EVP. 6e mondial. Hub de transbordement pour l'Asie du Nord-Est.", img: "", teu: "22.1M TEU", cargo: "Containers, bulk, Ro-Ro" },
  { id: "hkg", name: "Hong Kong", country: "China (SAR)", lat: 22.32, lng: 114.19, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "Once world's busiest. 16.7M TEU. Free port status. Major financial logistics hub in Pearl River Delta.", info_fr: "Autrefois le plus fréquenté au monde. 16,7M EVP. Statut de port franc. Hub financier-logistique.", img: "", teu: "16.7M TEU", cargo: "Containers, high-value goods" },
  { id: "tyo", name: "Tokyo-Yokohama", country: "Japan", lat: 35.44, lng: 139.65, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Japan's largest port complex. 7.8M TEU. Key gateway for Japan's manufacturing sector. Advanced automation.", info_fr: "Plus grand complexe portuaire japonais. 7,8M EVP. Porte d'entrée du secteur manufacturier japonais.", img: "", teu: "7.8M TEU", cargo: "Automobiles, electronics, containers" },
  // Middle East
  { id: "dxb", name: "Jebel Ali (Dubai)", country: "UAE", lat: 25.01, lng: 55.06, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "Largest man-made port. 14.4M TEU. Main hub between Europe and Asia. Free trade zone. DP World HQ.", info_fr: "Plus grand port artificiel du monde. 14,4M EVP. Hub principal entre Europe et Asie. Zone franche.", img: "", teu: "14.4M TEU", cargo: "Containers, re-export, transshipment" },
  { id: "auh", name: "Abu Dhabi (Khalifa)", country: "UAE", lat: 24.8, lng: 54.65, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Fast-growing UAE port. 5M TEU target. KIZAD industrial zone adjacent. New Silk Road connection.", info_fr: "Port des EAU en forte croissance. Objectif 5M EVP. Zone industrielle KIZAD adjacente.", img: "", teu: "1.8M TEU", cargo: "Containers, bulk, industrial" },
  // Americas
  { id: "lax", name: "Los Angeles", country: "USA", lat: 33.74, lng: -118.25, type_en: "Container", type_fr: "Conteneurs", info_en: "Busiest US port. 10.7M TEU. With Long Beach forms world's 4th complex. Gateway to US consumer market.", info_fr: "Port américain le plus fréquenté. 10,7M EVP. Avec Long Beach forme le 4e complexe mondial.", img: "", teu: "10.7M TEU", cargo: "Containers, imports from Asia" },
  { id: "lbch", name: "Long Beach", country: "USA", lat: 33.75, lng: -118.22, type_en: "Container", type_fr: "Conteneurs", info_en: "Second busiest US port. 9.1M TEU. Partners with LA. Major entry point for Asian goods into North America.", info_fr: "2e port américain. 9,1M EVP. Partenaire de LA. Point d'entrée principal des marchandises asiatiques.", img: "", teu: "9.1M TEU", cargo: "Containers, retail goods" },
  { id: "nyc", name: "New York / New Jersey", country: "USA", lat: 40.68, lng: -74.04, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "East Coast's busiest. 9.5M TEU. Bayonne Bridge raised to allow post-Panamax. Northeast US gateway.", info_fr: "Plus fréquenté de la côte Est. 9,5M EVP. Porte d'entrée du nord-est des États-Unis.", img: "", teu: "9.5M TEU", cargo: "Containers, general cargo" },
  { id: "sav", name: "Savannah", country: "USA", lat: 32.09, lng: -81.1, type_en: "Container", type_fr: "Conteneurs", info_en: "Fastest growing US port. 6M TEU. 2nd busiest East Coast. Key auto industry and retail distribution hub.", info_fr: "Port américain à la croissance la plus rapide. 6M EVP. 2e côte Est. Hub automobile et distribution.", img: "", teu: "6M TEU", cargo: "Containers, vehicles, retail" },
  { id: "san", name: "Santos", country: "Brazil", lat: -23.97, lng: -46.3, type_en: "Container & Bulk", type_fr: "Conteneurs & Vrac", info_en: "Latin America's largest port. 5M TEU. Handles 30% of Brazilian foreign trade. Soybean/sugar exports.", info_fr: "Plus grand port d'Amérique latine. 5M EVP. 30% du commerce extérieur brésilien. Export soja/sucre.", img: "", teu: "5M TEU", cargo: "Soy, sugar, containers, coffee" },
  // Africa
  { id: "tng", name: "Tanger Med", country: "Morocco", lat: 35.88, lng: -5.5, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "Africa's largest port. 9M TEU capacity. Strait of Gibraltar position. Free zone. Automotive industry hub.", info_fr: "Plus grand port d'Afrique. Capacité 9M EVP. Position Détroit de Gibraltar. Zone franche. Hub automobile.", img: "", teu: "7M TEU", cargo: "Containers, vehicles, transshipment" },
  { id: "dur", name: "Durban", country: "South Africa", lat: -29.88, lng: 31.03, type_en: "Container & General", type_fr: "Conteneurs & Général", info_en: "Sub-Saharan Africa's largest port. 2.8M TEU. Gateway to southern African hinterland. Coal and minerals.", info_fr: "Plus grand port d'Afrique subsaharienne. 2,8M EVP. Porte de l'hinterland africain austral.", img: "", teu: "2.8M TEU", cargo: "Containers, coal, minerals, cars" },
  { id: "psd", name: "Port Said", country: "Egypt", lat: 31.27, lng: 32.28, type_en: "Container & Transshipment", type_fr: "Conteneurs & Transbordement", info_en: "Suez Canal northern entrance. 4.8M TEU. Key transshipment hub between Mediterranean and Red Sea.", info_fr: "Entrée nord du Canal de Suez. 4,8M EVP. Hub de transbordement Méditerranée–Mer Rouge.", img: "", teu: "4.8M TEU", cargo: "Containers, transshipment" },
];

// ─── Straits ──────────────────────────────────────────────────────────────────
const WORLD_STRAITS: GeoPoint[] = [
  { id: "gib", name: "Strait of Gibraltar", country: "Spain / Morocco", lat: 35.95, lng: -5.55, type_en: "Atlantic–Mediterranean", type_fr: "Atlantique–Méditerranée", info_en: "14 km wide at narrowest. 100,000+ vessels/year. Gateway between Atlantic and Mediterranean. EU-Africa divide. Spain, UK (Gibraltar) and Morocco.", info_fr: "14 km au point le plus étroit. 100 000+ navires/an. Porte entre Atlantique et Méditerranée. Séparation UE-Afrique." },
  { id: "bos", name: "Bosphorus Strait", country: "Turkey", lat: 41.12, lng: 29.08, type_en: "Black Sea–Mediterranean", type_fr: "Mer Noire–Méditerranée", info_en: "0.7 km at narrowest. Splits Istanbul. Only access from Black Sea to Mediterranean. Turkish Straits Convention (Montreux 1936). 50,000 ships/year.", info_fr: "700 m au plus étroit. Sépare Istanbul. Seul accès entre Mer Noire et Méditerranée. Convention de Montreux (1936)." },
  { id: "dar", name: "Dardanelles", country: "Turkey", lat: 40.19, lng: 26.42, type_en: "Aegean–Black Sea", type_fr: "Égée–Mer Noire", info_en: "1.2 km wide. Connects Aegean to Sea of Marmara and Black Sea. Paired with Bosphorus. Gallipoli campaign (1915).", info_fr: "1,2 km de large. Relie la mer Égée à la mer de Marmara et à la mer Noire. Paire avec le Bosphore." },
  { id: "hor", name: "Strait of Hormuz", country: "Iran / Oman", lat: 26.56, lng: 56.26, type_en: "Persian Gulf–Arabian Sea", type_fr: "Golfe Persique–Mer d'Arabie", info_en: "33 km at narrowest. 20% of world's oil passes through. Critical energy chokepoint. Iran, Oman, UAE.", info_fr: "33 km au point le plus étroit. 20% du pétrole mondial y transite. Point de passage énergétique critique." },
  { id: "mal", name: "Strait of Malacca", country: "Malaysia / Singapore / Indonesia", lat: 2.5, lng: 101.5, type_en: "Indian Ocean–South China Sea", type_fr: "Océan Indien–Mer de Chine méridionale", info_en: "2.7 km at narrowest. 100,000 ships/year. 25% of world trade. World's busiest strait. Key Asia-Europe route.", info_fr: "2,7 km au plus étroit. 100 000 navires/an. 25% du commerce mondial. Détroit le plus fréquenté au monde." },
  { id: "bab", name: "Bab-el-Mandeb", country: "Yemen / Djibouti / Eritrea", lat: 12.58, lng: 43.42, type_en: "Red Sea–Arabian Sea", type_fr: "Mer Rouge–Mer d'Arabie", info_en: "30 km wide. 9M barrels oil/day. Gateway between Suez Canal and Indian Ocean. Strategic for Europe-Asia trade.", info_fr: "30 km de large. 9M barils pétrole/jour. Porte entre canal de Suez et océan Indien. Stratégique pour l'axe Europe-Asie." },
  { id: "eng", name: "English Channel (La Manche)", country: "France / United Kingdom", lat: 50.5, lng: 1.0, type_en: "Atlantic–North Sea", type_fr: "Atlantique–Mer du Nord", info_en: "33 km at Dover. World's busiest shipping lane. 500+ ships/day. Eurotunnel (1994). Calais–Dover ferry hub.", info_fr: "33 km à Douvres. Voie maritime la plus fréquentée au monde. 500+ navires/jour. Eurotunnel (1994)." },
  { id: "twn", name: "Taiwan Strait", country: "China / Taiwan", lat: 24.5, lng: 119.5, type_en: "East China Sea–South China Sea", type_fr: "Mer de Chine orientale–méridionale", info_en: "130 km wide. 50,000 vessels/year. Major geopolitical tension zone. Key route for Northeast Asia trade.", info_fr: "130 km de large. 50 000 navires/an. Zone de tension géopolitique majeure. Route clé du commerce Asie du NE." },
  { id: "ber", name: "Bering Strait", country: "Russia / USA (Alaska)", lat: 65.6, lng: -168.5, type_en: "Pacific–Arctic Ocean", type_fr: "Pacifique–Océan Arctique", info_en: "82 km wide. Connects Pacific and Arctic. Northern Sea Route potential due to climate change. Russia-USA divide.", info_fr: "82 km de large. Relie Pacifique et Arctique. Route maritime du Nord en développement via le changement climatique." },
];

// ─── Canals ───────────────────────────────────────────────────────────────────
const WORLD_CANALS: GeoPoint[] = [
  { id: "suez", name: "Suez Canal", country: "Egypt", lat: 30.42, lng: 32.35, type_en: "Red Sea–Mediterranean", type_fr: "Mer Rouge–Méditerranée", info_en: "193 km long. Opened 1869. 12% of world trade. 19,000 ships/year. New Canal (2015) doubled capacity. No locks needed.", info_fr: "193 km. Ouvert en 1869. 12% du commerce mondial. 19 000 navires/an. Nouveau canal (2015) doublement capacité.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Suez_Canal%2C_Sinai_Seen_From_Space.jpg/320px-Suez_Canal%2C_Sinai_Seen_From_Space.jpg" },
  { id: "pan", name: "Panama Canal", country: "Panama", lat: 9.08, lng: -79.68, type_en: "Atlantic–Pacific", type_fr: "Atlantique–Pacifique", info_en: "82 km long. Opened 1914. 6% of world trade. 14,000 ships/year. New locks (2016) allow neo-Panamax vessels.", info_fr: "82 km. Ouvert en 1914. 6% du commerce mondial. 14 000 navires/an. Nouvelles écluses (2016) pour post-Panamax.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Miraflores_locks_panorama.jpg/320px-Miraflores_locks_panorama.jpg" },
  { id: "kiel", name: "Kiel Canal", country: "Germany", lat: 54.32, lng: 9.9, type_en: "North Sea–Baltic", type_fr: "Mer du Nord–Baltique", info_en: "98 km long. World's busiest artificial waterway. 32,000 ships/year. Saves 460 km vs. rounding Jutland Peninsula.", info_fr: "98 km. Voie navigable artificielle la plus fréquentée. 32 000 navires/an. Économise 460 km vs. contournement du Jutland." },
  { id: "cor", name: "Corinth Canal", country: "Greece", lat: 37.93, lng: 23.0, type_en: "Gulf of Corinth–Saronic Gulf", type_fr: "Golfe de Corinthe–Golfe Saronique", info_en: "6.3 km long, only 21 m wide. Opened 1893. Connects Adriatic to Aegean. Limited to small vessels (sub-3000t).", info_fr: "6,3 km de long, seulement 21 m de large. Ouvert en 1893. Relie Adriatique à la mer Égée. Limité aux petits navires." },
  { id: "slr", name: "Saint Lawrence Seaway", country: "Canada / USA", lat: 45.3, lng: -74.0, type_en: "Great Lakes–Atlantic", type_fr: "Grands Lacs–Atlantique", info_en: "3,700 km total. Opened 1959. Connects Great Lakes to Atlantic. Handles 50M tonnes/year. Seaway locks: 225m×24m.", info_fr: "3 700 km au total. Ouvert en 1959. Relie les Grands Lacs à l'Atlantique. 50M tonnes/an." },
  { id: "rhn", name: "Rhine Corridor", country: "Switzerland / Germany / Netherlands", lat: 50.93, lng: 6.96, type_en: "Industrial Waterway", type_fr: "Voie industrielle fluviale", info_en: "820 km navigable. Basel to Rotterdam. Europe's busiest inland waterway. 200M tonnes/year. Chemical, coal, containers.", info_fr: "820 km navigables. Bâle–Rotterdam. Voie fluviale la plus fréquentée d'Europe. 200M tonnes/an." },
  { id: "dan", name: "Danube Corridor", country: "10 European Countries", lat: 47.8, lng: 18.2, type_en: "European Inland Waterway", type_fr: "Voie navigable intérieure", info_en: "2,860 km. Europe's 2nd longest river. Connects Black Sea to Central Europe (Vienna, Budapest, Belgrade). Rhine-Danube Canal completed 1992.", info_fr: "2 860 km. 2e fleuve d'Europe. Relie la mer Noire à l'Europe centrale. Canal Rhin-Danube achevé en 1992." },
];

// ─── Quiz Questions ───────────────────────────────────────────────────────────
type QuizCategory = "france_regions" | "france_depts" | "ports" | "straits" | "canals";

interface QuizQuestion {
  question: string;
  question_fr: string;
  answer: string;
  options: string[];
  explanation: string;
  explanation_fr: string;
  category: QuizCategory;
}

function buildQuizQuestions(): QuizQuestion[] {
  const qs: QuizQuestion[] = [];

  // France Regions (logistics-focused)
  const regionQs: [string, string, string, string][] = [
    ["Which region contains France's main container port, Le Havre?", "Quelle région contient le principal port conteneurs de France, Le Havre ?", "Normandie", "Le Havre (Port 2000) is in Seine-Maritime department, in Normandie region."],
    ["Which French region borders Germany, Luxembourg, Switzerland AND Belgium?", "Quelle région française borde l'Allemagne, le Luxembourg, la Suisse ET la Belgique ?", "Grand Est", "Grand Est is unique in bordering 4 countries: Germany, Luxembourg, Switzerland and Belgium."],
    ["Which region hosts France's largest port by tonnage, Marseille-Fos?", "Quelle région accueille le 1er port français en tonnage, Marseille-Fos ?", "Provence-Alpes-Côte d'Azur", "Marseille-Fos (PACA) handles 80 million tonnes per year, making it France's largest port by tonnage."],
    ["Where is the Eurotunnel terminal (Channel Tunnel) located in France?", "Où se trouve le terminal Eurotunnel en France ?", "Hauts-de-France", "The Eurotunnel French terminal is at Coquelles, near Calais, in the Hauts-de-France region."],
    ["Which region is home to Airbus headquarters and production in France?", "Quelle région accueille le siège d'Airbus en France ?", "Occitanie", "Airbus has its headquarters and main assembly lines in Toulouse (Haute-Garonne), in Occitanie."],
    ["Which region contains the Rhine port of Strasbourg (2nd largest river port in Europe)?", "Quelle région contient le port de Strasbourg, 2e port fluvial d'Europe ?", "Grand Est", "Port Autonome de Strasbourg is located in Grand Est. It handles 8 million tonnes/year on the Rhine."],
    ["Which French region handles 30% of France's national GDP?", "Quelle région française représente 30% du PIB national ?", "Île-de-France", "Île-de-France (Paris and surroundings) concentrates 30% of France's GDP and is Europe's largest logistics cluster."],
  ];

  for (const [q, qf, answer, exp] of regionQs) {
    const regionNames = FRANCE_REGIONS.map(r => r.name);
    const wrongOptions = regionNames.filter(n => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    qs.push({ question: q, question_fr: qf, answer, options: [...wrongOptions, answer].sort(() => Math.random() - 0.5), explanation: exp, explanation_fr: exp, category: "france_regions" });
  }

  // France Departments
  const deptQs: [string, string, string, string][] = [
    ["What is the prefecture of department 75?", "Quelle est la préfecture du département 75 ?", "Paris", "Department 75 is Paris itself — the only department that is also a city and a commune."],
    ["Which department is Marseille in?", "Dans quel département se trouve Marseille ?", "13 — Bouches-du-Rhône", "Marseille is the prefecture of the Bouches-du-Rhône department (13), in PACA."],
    ["Which department number is Strasbourg in?", "Dans quel département se trouve Strasbourg ?", "67 — Bas-Rhin", "Strasbourg is the prefecture of Bas-Rhin (67), the northern Rhine department of Grand Est."],
    ["Which department contains the port of Dunkirk?", "Quel département contient le port de Dunkerque ?", "59 — Nord", "Dunkirk is located in the Nord department (59), France's 3rd largest port, in Hauts-de-France."],
    ["In which department is the city of Lyon located?", "Dans quel département se trouve Lyon ?", "69 — Rhône", "Lyon is the prefecture of the Rhône department (69), in Auvergne-Rhône-Alpes."],
    ["Which department number is Lille in?", "Dans quel département se trouve Lille ?", "59 — Nord", "Lille is the prefecture of the Nord department (59). It is the 4th largest French city."],
    ["What region does department 13 (Bouches-du-Rhône) belong to?", "À quelle région appartient le département 13 (Bouches-du-Rhône) ?", "Provence-Alpes-Côte d'Azur", "Bouches-du-Rhône (13) is in PACA. It contains Marseille, France's 2nd city and largest Mediterranean port."],
  ];

  for (const [q, qf, answer, exp] of deptQs) {
    const deptNames = ["69 — Rhône", "13 — Bouches-du-Rhône", "59 — Nord", "67 — Bas-Rhin", "75 — Paris", "31 — Haute-Garonne", "33 — Gironde", "Île-de-France", "Normandie", "Grand Est", "Occitanie", "Hauts-de-France", "Provence-Alpes-Côte d'Azur", "Paris", "Lyon", "Marseille", "Bordeaux"];
    const wrongOptions = deptNames.filter(n => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    qs.push({ question: q, question_fr: qf, answer, options: [...wrongOptions, answer].sort(() => Math.random() - 0.5), explanation: exp, explanation_fr: exp, category: "france_depts" });
  }

  // Ports
  const portQs: [string, string, string, string][] = [
    ["Which is Europe's largest container port by TEU?", "Quel est le plus grand port conteneurs d'Europe en EVP ?", "Rotterdam", "Rotterdam handles 14.5 million TEU per year, making it Europe's largest port and 11th worldwide."],
    ["Which port handles the most container traffic in the world?", "Quel port traite le plus de conteneurs au monde ?", "Shanghai", "Shanghai handled 47.3 million TEU in 2023, the highest of any port worldwide, driven by the Yangshan deepwater terminal."],
    ["Which African port has the largest container capacity?", "Quel port africain a la plus grande capacité conteneurs ?", "Tanger Med", "Tanger Med (Morocco) has a capacity of 9 million TEU and is the largest port on the African continent."],
    ["Which port is France's main container port?", "Quel est le principal port conteneurs de France ?", "Le Havre", "Le Havre (Port 2000) is France's largest container port with 2.9 million TEU and serves the Paris hinterland."],
    ["Through which port does 20% of the world's oil supply pass?", "Par quel détroit transitent 20% des approvisionnements pétroliers mondiaux ?", "Jebel Ali (Dubai)", "The Strait of Hormuz near Jebel Ali controls 20% of world oil. Jebel Ali is the main transshipment hub for the Gulf region."],
    ["Which port is called the 'Gateway to Latin America'?", "Quel port est appelé 'Porte de l'Amérique latine' ?", "Santos", "Santos (Brazil) is the largest port in Latin America handling 5 million TEU and 30% of Brazil's foreign trade."],
    ["Which European port is operated by Chinese company COSCO?", "Quel port européen est opéré par la société chinoise COSCO ?", "Piraeus", "The Port of Piraeus (Greece) has been majority-operated by China's COSCO since 2016, making it a key New Silk Road node."],
  ];

  for (const [q, qf, answer, exp] of portQs) {
    const portNames = WORLD_PORTS.map(p => p.name);
    const wrongOptions = portNames.filter(n => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    qs.push({ question: q, question_fr: qf, answer, options: [...wrongOptions, answer].sort(() => Math.random() - 0.5), explanation: exp, explanation_fr: exp, category: "ports" });
  }

  // Straits
  const straitQs: [string, string, string, string][] = [
    ["Which strait carries 25% of global maritime trade?", "Quel détroit transporte 25% du commerce maritime mondial ?", "Strait of Malacca", "The Strait of Malacca, between Malaysia, Singapore and Indonesia, carries about 25% of world trade and 100,000 ships per year."],
    ["Which strait connects the Black Sea to the Mediterranean Sea?", "Quel détroit relie la Mer Noire à la Méditerranée ?", "Bosphorus Strait", "The Bosphorus Strait (Turkey) is the only outlet from the Black Sea to the Mediterranean. It splits the city of Istanbul."],
    ["Which strait carries 20% of the world's oil supply daily?", "Quel détroit transporte 20% des approvisionnements pétroliers mondiaux quotidiens ?", "Strait of Hormuz", "The Strait of Hormuz (Iran/Oman) is the world's most critical energy chokepoint: 9 tankers transit per hour."],
    ["Which strait is the world's busiest shipping lane, with 500+ ships per day?", "Quel détroit est la voie maritime la plus fréquentée avec 500+ navires/jour ?", "English Channel (La Manche)", "The English Channel (Dover Strait) sees over 500 ships per day, making it the world's busiest shipping lane."],
    ["Which strait separates Europe from Africa?", "Quel détroit sépare l'Europe de l'Afrique ?", "Strait of Gibraltar", "The Strait of Gibraltar (14 km wide) separates Spain from Morocco and connects the Atlantic to the Mediterranean."],
    ["Which strait connects the Red Sea to the Indian Ocean?", "Quel détroit relie la Mer Rouge à l'Océan Indien ?", "Bab-el-Mandeb", "Bab-el-Mandeb is the gateway between the Red Sea (and Suez Canal) and the Arabian Sea/Indian Ocean. Yemen, Djibouti, Eritrea."],
  ];

  for (const [q, qf, answer, exp] of straitQs) {
    const straitNames = WORLD_STRAITS.map(s => s.name);
    const wrongOptions = straitNames.filter(n => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    qs.push({ question: q, question_fr: qf, answer, options: [...wrongOptions, answer].sort(() => Math.random() - 0.5), explanation: exp, explanation_fr: exp, category: "straits" });
  }

  // Canals
  const canalQs: [string, string, string, string][] = [
    ["Which canal carries 12% of world maritime trade?", "Quel canal transporte 12% du commerce maritime mondial ?", "Suez Canal", "The Suez Canal (Egypt, opened 1869, 193 km) carries about 12% of global trade, linking Red Sea and Mediterranean."],
    ["Which canal connects the Atlantic Ocean to the Pacific Ocean?", "Quel canal relie l'Océan Atlantique à l'Océan Pacifique ?", "Panama Canal", "The Panama Canal (82 km, opened 1914) is the only crossing between the Atlantic and Pacific in the Americas."],
    ["Which is the world's busiest artificial waterway by ship count?", "Quelle est la voie navigable artificielle la plus fréquentée au monde ?", "Kiel Canal", "The Kiel Canal (Germany, 98 km) handles 32,000 ships/year — the highest number of any artificial waterway worldwide."],
    ["Which canal allows Great Lakes shipping to reach the Atlantic?", "Quel canal permet aux navires des Grands Lacs d'atteindre l'Atlantique ?", "Saint Lawrence Seaway", "The Saint Lawrence Seaway (Canada/USA, opened 1959) connects the Great Lakes (5,000 km inland) to the Atlantic Ocean."],
    ["Which European river corridor handles 200 million tonnes per year?", "Quel corridor fluvial européen traite 200 millions de tonnes par an ?", "Rhine Corridor", "The Rhine (820 km navigable, Basel to Rotterdam) is Europe's busiest inland waterway with 200 million tonnes/year."],
    ["Which canal connects two Greek seas, cutting off the Peloponnese peninsula?", "Quel canal connecte deux mers grecques, séparant la péninsule du Péloponnèse ?", "Corinth Canal", "The Corinth Canal (6.3 km, 21 m wide, opened 1893) cuts through the Corinth isthmus connecting the Ionian and Aegean seas."],
  ];

  for (const [q, qf, answer, exp] of canalQs) {
    const canalNames = WORLD_CANALS.map(c => c.name);
    const wrongOptions = canalNames.filter(n => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    qs.push({ question: q, question_fr: qf, answer, options: [...wrongOptions, answer].sort(() => Math.random() - 0.5), explanation: exp, explanation_fr: exp, category: "canals" });
  }

  return qs;
}

// ─── Score system ─────────────────────────────────────────────────────────────
interface ScoreState { xp: number; correct: number; wrong: number; streak: number }
const SCORE_KEY = "geo_score_v3";

function useScore() {
  const [s, setS] = useState<ScoreState>(() => {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || "{}"); } catch { return { xp: 0, correct: 0, wrong: 0, streak: 0 }; }
  });
  const save = (ns: ScoreState) => { setS(ns); localStorage.setItem(SCORE_KEY, JSON.stringify(ns)); };
  const correct = () => save({ ...s, xp: s.xp + (s.streak >= 3 ? 20 : 10), correct: s.correct + 1, wrong: s.wrong, streak: s.streak + 1 });
  const wrong = () => save({ ...s, xp: Math.max(0, s.xp - 3), correct: s.correct, wrong: s.wrong + 1, streak: 0 });
  const reset = () => save({ xp: 0, correct: 0, wrong: 0, streak: 0 });
  const level = Math.floor(s.xp / 100) + 1;
  return { s, level, correct, wrong, reset };
}

// ─── MapFitter ────────────────────────────────────────────────────────────────
function MapFitter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

// ─── France Map Tab ───────────────────────────────────────────────────────────
type FranceLayer = "regions" | "departments";

function FranceMapTab({ L, addCorrect, addWrong }: { L: (e: string, f: string) => string; addCorrect: () => void; addWrong: () => void }) {
  const [layer, setLayer] = useState<FranceLayer>("regions");
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizTarget, setQuizTarget] = useState<RegionInfo | DeptInfo | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const REGIONS_URL = "https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/regions.geojson";
  const DEPTS_URL = "https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/departements.geojson";

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    const url = layer === "regions" ? REGIONS_URL : DEPTS_URL;
    fetch(url).then(r => r.json()).then(data => { setGeoData(data); setLoading(false); }).catch(() => setLoading(false));
  }, [layer]);

  const startQuiz = useCallback(() => {
    if (layer === "regions") {
      setQuizTarget(FRANCE_REGIONS[Math.floor(Math.random() * FRANCE_REGIONS.length)]);
    } else {
      const metro = FRANCE_DEPTS.filter(d => d.code.length <= 2 || d.code === "2A" || d.code === "2B");
      setQuizTarget(metro[Math.floor(Math.random() * metro.length)]);
    }
    setFeedback(null);
    setSelected(null);
    setQuizMode(true);
  }, [layer]);

  const handleFeatureClick = useCallback((feature: any) => {
    const props = feature.properties;
    if (quizMode && quizTarget) {
      const nameMatch = layer === "regions"
        ? props.nom === (quizTarget as RegionInfo).name
        : props.code === (quizTarget as DeptInfo).code;
      if (nameMatch) {
        setFeedback("correct");
        addCorrect();
        setTimeout(() => {
          setFeedback(null);
          if (layer === "regions") setQuizTarget(FRANCE_REGIONS[Math.floor(Math.random() * FRANCE_REGIONS.length)]);
          else {
            const metro = FRANCE_DEPTS.filter(d => d.code.length <= 2 || d.code === "2A" || d.code === "2B");
            setQuizTarget(metro[Math.floor(Math.random() * metro.length)]);
          }
          setSelected(null);
        }, 1200);
      } else {
        setFeedback("wrong");
        addWrong();
        setTimeout(() => setFeedback(null), 1200);
      }
    } else {
      if (layer === "regions") {
        setSelected(FRANCE_REGIONS.find(r => r.name === props.nom) || { code: props.code, name: props.nom, name_fr: props.nom, capital: "—", cities: "—", roads: "—", logistics: "—", ports: "—", importance: "—", importance_fr: "—" });
      } else {
        setSelected(FRANCE_DEPTS.find(d => d.code === props.code) || { code: props.code, name: props.nom, prefecture: "—", region: "—" });
      }
    }
  }, [quizMode, quizTarget, layer, addCorrect, addWrong]);

  const styleFeature = useCallback((feature: any): PathOptions => {
    const props = feature?.properties;
    if (quizMode && quizTarget) {
      const isTarget = layer === "regions" ? props?.nom === (quizTarget as RegionInfo).name : props?.code === (quizTarget as DeptInfo).code;
      if (isTarget && feedback === "correct") return { fillColor: "#22c55e", fillOpacity: 0.7, color: "#16a34a", weight: 2 };
    }
    const isSelected = layer === "regions"
      ? selected && props?.nom === (selected as RegionInfo).name
      : selected && props?.code === (selected as DeptInfo).code;
    if (isSelected) return { fillColor: "#3b82f6", fillOpacity: 0.5, color: "#1d4ed8", weight: 2 };
    return { fillColor: "#1a2e4a", fillOpacity: 0.15, color: "#3b82f6", weight: 1 };
  }, [quizMode, quizTarget, feedback, selected, layer]);

  const onEachFeature = useCallback((feature: any, leafletLayer: Layer) => {
    leafletLayer.on({ click: () => handleFeatureClick(feature) });
    (leafletLayer as any).on("mouseover", () => {
      (leafletLayer as any).setStyle({ fillOpacity: 0.4 });
    });
    (leafletLayer as any).on("mouseout", () => {
      (leafletLayer as any).setStyle(styleFeature(feature));
    });
  }, [handleFeatureClick, styleFeature]);

  const regionInfo = layer === "regions" ? selected as RegionInfo | null : null;
  const deptInfo = layer === "departments" ? selected as DeptInfo | null : null;
  const deptRegion = deptInfo ? FRANCE_REGIONS.find(r => r.name === deptInfo.region) : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => { setLayer("regions"); setSelected(null); setQuizMode(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${layer === "regions" ? "bg-[#1a2e4a] dark:bg-blue-700 text-white border-transparent" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
            {L("13 Regions", "13 Régions")}
          </button>
          <button onClick={() => { setLayer("departments"); setSelected(null); setQuizMode(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${layer === "departments" ? "bg-[#1a2e4a] dark:bg-blue-700 text-white border-transparent" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
            {L("101 Departments", "101 Départements")}
          </button>
        </div>
        <div className="flex gap-2">
          {quizMode
            ? <button onClick={() => { setQuizMode(false); setQuizTarget(null); setFeedback(null); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold">{L("Stop Quiz", "Arrêter")}</button>
            : <button onClick={startQuiz} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">{L("Quiz Mode", "Mode Quiz")}</button>
          }
        </div>
      </div>

      {/* Quiz prompt */}
      {quizMode && quizTarget && (
        <div className={`rounded-xl px-4 py-3 text-center font-semibold text-sm border-2 transition-all ${feedback === "correct" ? "bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-400" : feedback === "wrong" ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"}`}>
          {feedback === "correct" ? "✓ " + L("Correct!", "Correct !") : feedback === "wrong" ? "✗ " + L("Wrong — try again", "Incorrect — réessayez") : (
            <>
              {layer === "regions" ? L("Click on the region:", "Cliquez sur la région :") : L("Click on the department:", "Cliquez sur le département :")}
              {" "}<span className="font-bold text-lg">
                {layer === "regions" ? (quizTarget as RegionInfo).name : `${(quizTarget as DeptInfo).code} — ${(quizTarget as DeptInfo).name}`}
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        {/* Map */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: 480 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 z-10">
              <div className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> {L("Loading map…", "Chargement de la carte…")}
              </div>
            </div>
          )}
          <MapContainer center={[46.5, 2.5]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {geoData && (
              <GeoJSON key={layer} data={geoData} style={styleFeature as GeoJSONOptions["style"]} onEachFeature={onEachFeature} />
            )}
          </MapContainer>
        </div>

        {/* Info panel */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto" style={{ maxHeight: 480 }}>
          {!selected && !quizMode && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <Globe size={32} className="opacity-50" />
              <p className="text-sm">{L("Click a region or department on the map to see detailed logistics information.", "Cliquez sur une région ou un département pour voir les informations logistiques.")}</p>
            </div>
          )}
          {!selected && quizMode && quizTarget && (
            <div className="space-y-2">
              <h4 className="font-bold text-[#1a2e4a] dark:text-blue-300">{L("Quiz Active", "Quiz en cours")}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{L("Click on the map to identify the highlighted location.", "Cliquez sur la carte pour identifier la zone demandée.")}</p>
            </div>
          )}
          {regionInfo && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 text-lg">{regionInfo.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{L("INSEE code:", "Code INSEE :")} {regionInfo.code}</p>
              </div>
              {[
                { label: L("Capital", "Capitale"), value: regionInfo.capital },
                { label: L("Main cities", "Principales villes"), value: regionInfo.cities },
                { label: L("Main roads", "Axes routiers"), value: regionInfo.roads },
                { label: L("Logistics zones", "Zones logistiques"), value: regionInfo.logistics },
                { label: L("Ports", "Ports"), value: regionInfo.ports },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{value}</div>
                </div>
              ))}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">{L("Strategic importance", "Importance stratégique")}</div>
                <div className="text-xs text-blue-800 dark:text-blue-300">{L(regionInfo.importance, regionInfo.importance_fr)}</div>
              </div>
            </div>
          )}
          {deptInfo && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 text-lg">{deptInfo.code} — {deptInfo.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{deptInfo.region}</p>
              </div>
              {[
                { label: L("Prefecture", "Préfecture"), value: deptInfo.prefecture },
                { label: L("Region", "Région"), value: deptInfo.region },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{value}</div>
                </div>
              ))}
              {deptRegion && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">{L("Regional logistics", "Logistique régionale")}</div>
                  <div className="text-xs text-blue-800 dark:text-blue-300">{L(deptRegion.importance, deptRegion.importance_fr)}</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-2"><span className="font-semibold">{L("Key roads:", "Axes routiers :")}</span> {deptRegion.roads}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── World Map Tab ─────────────────────────────────────────────────────────────
type WorldLayer = "ports" | "straits" | "canals";

function WorldMapTab({ L, addCorrect, addWrong }: { L: (e: string, f: string) => string; addCorrect: () => void; addWrong: () => void }) {
  const [worldLayer, setWorldLayer] = useState<WorldLayer>("ports");
  const [selected, setSelected] = useState<GeoPoint | null>(null);
  const [imgError, setImgError] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizTarget, setQuizTarget] = useState<GeoPoint | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const points = worldLayer === "ports" ? WORLD_PORTS : worldLayer === "straits" ? WORLD_STRAITS : WORLD_CANALS;
  const colorMap: Record<WorldLayer, string> = { ports: "#3b82f6", straits: "#f59e0b", canals: "#10b981" };
  const color = colorMap[worldLayer];

  const startQuiz = () => {
    const target = points[Math.floor(Math.random() * points.length)];
    setQuizTarget(target);
    setFeedback(null);
    setFeedbackMsg("");
    setSelected(null);
    setQuizMode(true);
  };

  const handleMarkerClick = (pt: GeoPoint) => {
    if (quizMode && quizTarget) {
      if (pt.id === quizTarget.id) {
        setFeedback("correct");
        setFeedbackMsg(L("Correct!", "Correct !"));
        addCorrect();
        setTimeout(() => {
          const next = points[Math.floor(Math.random() * points.length)];
          setQuizTarget(next);
          setFeedback(null);
          setSelected(null);
        }, 1500);
      } else {
        setFeedback("wrong");
        setFeedbackMsg(L(`Wrong! That was ${pt.name}. Looking for: ${quizTarget.name}`, `Incorrect ! C'était ${pt.name}. On cherche : ${quizTarget.name}`));
        addWrong();
        setTimeout(() => setFeedback(null), 2500);
      }
    } else {
      setSelected(pt);
      setImgError(false);
    }
  };

  const viewConfig: Record<WorldLayer, { center: [number, number]; zoom: number }> = {
    ports: { center: [20, 40], zoom: 2 },
    straits: { center: [25, 50], zoom: 2 },
    canals: { center: [20, 20], zoom: 2 },
  };

  return (
    <div className="space-y-4">
      {/* Layer controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["ports", "straits", "canals"] as WorldLayer[]).map(w => {
            const labels = { ports: [L("Ports", "Ports"), "28"], straits: [L("Straits", "Détroits"), "9"], canals: [L("Canals", "Canaux"), "7"] };
            return (
              <button key={w} onClick={() => { setWorldLayer(w); setSelected(null); setQuizMode(false); setFeedback(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${worldLayer === w ? "bg-[#1a2e4a] dark:bg-blue-700 text-white border-transparent" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
                {labels[w][0]} <span className="text-[10px] opacity-70">({labels[w][1]})</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {quizMode
            ? <button onClick={() => { setQuizMode(false); setQuizTarget(null); setFeedback(null); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold">{L("Stop Quiz", "Arrêter")}</button>
            : <button onClick={startQuiz} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">{L("Quiz Mode", "Mode Quiz")}</button>
          }
        </div>
      </div>

      {/* Quiz prompt */}
      {quizMode && quizTarget && (
        <div className={`rounded-xl px-4 py-3 text-center font-semibold text-sm border-2 transition-all ${feedback === "correct" ? "bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-400" : feedback === "wrong" ? "bg-red-50 border-red-400 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-300"}`}>
          {feedback ? feedbackMsg : <>{L("Click on the map to locate:", "Cliquez sur la carte pour localiser :")} <span className="font-bold">{quizTarget.name}</span> ({quizTarget.country})</>}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: 480 }}>
          <MapContainer center={viewConfig[worldLayer].center} zoom={viewConfig[worldLayer].zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <MapFitter center={viewConfig[worldLayer].center} zoom={viewConfig[worldLayer].zoom} />
            {points.map(pt => {
              const isTarget = quizTarget?.id === pt.id;
              const isSelected = selected?.id === pt.id;
              const r = isTarget && quizMode ? 14 : isSelected ? 12 : 9;
              const fill = isTarget && quizMode && feedback === "correct" ? "#22c55e" : isSelected ? "#ef4444" : color;
              return (
                <CircleMarker key={pt.id} center={[pt.lat, pt.lng]} radius={r} pathOptions={{ color: "#fff", fillColor: fill, fillOpacity: 0.85, weight: 2 }}
                  eventHandlers={{ click: () => handleMarkerClick(pt) }}>
                  {!quizMode && (
                    <Popup>
                      <div className="text-xs font-semibold">{pt.name}</div>
                      <div className="text-xs text-gray-500">{pt.country}</div>
                    </Popup>
                  )}
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Info panel */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto" style={{ maxHeight: 480 }}>
          {!selected && !quizMode && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <Anchor size={32} className="opacity-50" />
              <p className="text-sm">{L("Click a marker on the map to see detailed information.", "Cliquez sur un marqueur pour voir les informations.")}</p>
              <div className="mt-2 grid grid-cols-1 gap-2 w-full text-left">
                {points.slice(0, 4).map(p => (
                  <button key={p.id} onClick={() => { setSelected(p); setImgError(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-400 text-left transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.country}</div>
                    </div>
                    <ChevronRight size={12} className="ml-auto text-slate-400" />
                  </button>
                ))}
                <p className="text-[10px] text-slate-400 text-center">{L("and more…", "et plus…")}</p>
              </div>
            </div>
          )}
          {selected && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 text-base">{selected.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{selected.country}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}>{L(selected.type_en, selected.type_fr)}</span>
                </div>
              </div>

              {selected.img && !imgError && (
                <img src={selected.img} alt={selected.name} onError={() => setImgError(true)}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
              )}
              {(!selected.img || imgError) && (
                <div className="w-full h-20 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 text-xs gap-2">
                  <Globe size={16} /> {selected.name}
                </div>
              )}

              {selected.teu && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-700 flex gap-4 text-xs">
                  <div><div className="text-blue-500 font-bold text-sm">{selected.teu}</div><div className="text-blue-700 dark:text-blue-400">{L("Volume", "Volume")}</div></div>
                  <div><div className="text-blue-500 font-semibold">{selected.cargo}</div><div className="text-blue-700 dark:text-blue-400">{L("Main cargo", "Cargo principal")}</div></div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{L("Strategic role", "Rôle stratégique")}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{L(selected.info_en, selected.info_fr)}</p>
              </div>

              <div className="flex gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center flex-1">
                  <div className="text-[10px] text-slate-400">{L("Latitude", "Latitude")}</div>
                  <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">{selected.lat.toFixed(2)}°</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 text-center flex-1">
                  <div className="text-[10px] text-slate-400">{L("Longitude", "Longitude")}</div>
                  <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">{selected.lng.toFixed(2)}°</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick list */}
      {!quizMode && !selected && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {points.map(p => (
            <button key={p.id} onClick={() => { setSelected(p); setImgError(false); }}
              className="text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{p.name}</div>
              </div>
              <div className="text-[10px] text-slate-400 pl-4">{p.country}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────
const ALL_QUIZ_QUESTIONS = buildQuizQuestions();
const QUIZ_TIME = 30;

function QuizTab({ L, addCorrect, addWrong }: { L: (e: string, f: string) => string; addCorrect: () => void; addWrong: () => void }) {
  const [category, setCategory] = useState<QuizCategory | "all">("all");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildQuestions = (cat: QuizCategory | "all") => {
    const pool = cat === "all" ? ALL_QUIZ_QUESTIONS : ALL_QUIZ_QUESTIONS.filter(q => q.category === cat);
    return [...pool].sort(() => Math.random() - 0.5);
  };

  const startQuiz = () => {
    const qs = buildQuestions(category);
    setQuestions(qs);
    setIdx(0);
    setChosen(null);
    setSessionCorrect(0);
    setSessionWrong(0);
    setTimeLeft(QUIZ_TIME);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || chosen !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setChosen("__timeout__");
          addWrong();
          setSessionWrong(w => w + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, idx, chosen, addWrong]);

  const handleAnswer = (opt: string) => {
    if (chosen !== null) return;
    setChosen(opt);
    if (timerRef.current) clearInterval(timerRef.current);
    if (opt === questions[idx].answer) {
      addCorrect();
      setSessionCorrect(c => c + 1);
    } else {
      addWrong();
      setSessionWrong(w => w + 1);
    }
  };

  const nextQuestion = () => {
    if (idx + 1 >= questions.length) {
      setStarted(false);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
      setTimeLeft(QUIZ_TIME);
    }
  };

  const catLabels: Record<QuizCategory | "all", [string, string]> = {
    all: ["All Topics", "Tous les sujets"],
    france_regions: ["French Regions", "Régions françaises"],
    france_depts: ["Departments", "Départements"],
    ports: ["World Ports", "Ports mondiaux"],
    straits: ["Straits", "Détroits"],
    canals: ["Canals", "Canaux"],
  };

  if (!started) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="font-bold text-[#1a2e4a] dark:text-blue-300 mb-1">{L("Choose a topic", "Choisissez un sujet")}</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(catLabels) as (QuizCategory | "all")[]).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${category === c ? "bg-[#1a2e4a] dark:bg-blue-700 text-white border-transparent" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
                {L(catLabels[c][0], catLabels[c][1])}
              </button>
            ))}
          </div>
        </div>

        {sessionCorrect + sessionWrong > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">{L("Last Session Results", "Résultats de la dernière session")}</h4>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircle size={16} /><span className="font-bold text-lg">{sessionCorrect}</span><span className="text-sm">{L("correct", "corrects")}</span></div>
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400"><XCircle size={16} /><span className="font-bold text-lg">{sessionWrong}</span><span className="text-sm">{L("wrong", "incorrects")}</span></div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400"><Star size={16} /><span className="font-bold text-lg">{Math.round(sessionCorrect / (sessionCorrect + sessionWrong) * 100)}%</span></div>
            </div>
          </div>
        )}

        <button onClick={startQuiz} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2">
          <BookOpen size={20} /> {L("Start Quiz", "Démarrer le quiz")}
        </button>
      </div>
    );
  }

  if (!questions.length || idx >= questions.length) {
    return (
      <div className="text-center py-8">
        <Trophy size={40} className="text-yellow-400 mx-auto mb-3" />
        <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200 mb-1">{L("Quiz Complete!", "Quiz terminé !")}</h3>
        <p className="text-slate-500 mb-4">{sessionCorrect} / {sessionCorrect + sessionWrong} {L("correct", "corrects")} — {Math.round(sessionCorrect / Math.max(1, sessionCorrect + sessionWrong) * 100)}%</p>
        <button onClick={startQuiz} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all">{L("Try Again", "Rejouer")}</button>
      </div>
    );
  }

  const q = questions[idx];
  const timePct = (timeLeft / QUIZ_TIME) * 100;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Progress & timer */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-xs text-slate-400">{L(`Question ${idx + 1} of ${questions.length}`, `Question ${idx + 1} sur ${questions.length}`)}</div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} className={timeLeft <= 10 ? "text-red-500" : "text-slate-400"} />
          <span className={`font-mono font-bold text-sm ${timeLeft <= 10 ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${timePct > 60 ? "bg-green-500" : timePct > 30 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${timePct}%` }} />
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
          {L(catLabels[q.category][0], catLabels[q.category][1])}
        </span>
        <span className="text-xs text-slate-400">{sessionCorrect} ✓ {sessionWrong} ✗</span>
      </div>

      {/* Question */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-relaxed">{L(q.question, q.question_fr)}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {q.options.map(opt => {
          let cls = "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20";
          if (chosen !== null) {
            if (opt === q.answer) cls = "border-green-400 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
            else if (opt === chosen && opt !== q.answer) cls = "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            else cls = "border-slate-200 dark:border-slate-700 text-slate-400 opacity-60";
          }
          return (
            <button key={opt} onClick={() => handleAnswer(opt)} disabled={chosen !== null}
              className={`text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${cls}`}>
              <div className="flex items-center gap-2">
                {chosen !== null && opt === q.answer && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                {chosen !== null && opt === chosen && opt !== q.answer && <XCircle size={14} className="text-red-500 shrink-0" />}
                {opt}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {chosen !== null && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Info size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">{L("Explanation", "Explication")}</span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300">{chosen === "__timeout__" ? L(`Time's up! The correct answer was: ${q.answer}`, `Temps écoulé ! La bonne réponse était : ${q.answer}`) : L(q.explanation, q.explanation_fr)}</p>
          <button onClick={nextQuestion} className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-all">
            {idx + 1 >= questions.length ? L("See Results", "Voir les résultats") : L("Next Question →", "Question suivante →")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Score Panel ──────────────────────────────────────────────────────────────
function ScorePanel({ s, level, reset, L }: { s: ScoreState; level: number; reset: () => void; L: (e: string, f: string) => string }) {
  const xpInLevel = s.xp % 100;
  const total = s.correct + s.wrong;
  return (
    <div className="bg-gradient-to-r from-[#1a2e4a] to-blue-700 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 text-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Trophy size={24} className="text-yellow-300" />
        </div>
        <div>
          <div className="text-xs text-blue-200">{L("Level", "Niveau")} {level}</div>
          <div className="font-bold text-xl">{s.xp} XP</div>
        </div>
      </div>
      <div className="flex-1 min-w-[140px]">
        <div className="text-xs text-blue-200 mb-1">XP {L("progress", "progression")}</div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${xpInLevel}%` }} />
        </div>
        <div className="text-xs text-blue-200 mt-0.5">{xpInLevel}/100 → {L("Level", "Niveau")} {level + 1}</div>
      </div>
      <div className="flex gap-4 text-center">
        <div><div className="text-lg font-bold text-green-300">{s.correct}</div><div className="text-xs text-blue-200">{L("Correct", "Corrects")}</div></div>
        <div><div className="text-lg font-bold text-red-300">{s.wrong}</div><div className="text-xs text-blue-200">{L("Wrong", "Incorrects")}</div></div>
        <div><div className="text-lg font-bold">{total > 0 ? Math.round(s.correct / total * 100) : 0}%</div><div className="text-xs text-blue-200">{L("Rate", "Taux")}</div></div>
      </div>
      <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors">
        <RefreshCw size={12} /> {L("Reset", "Réinit.")}
      </button>
    </div>
  );
}

// ─── Main GeoChallenge ────────────────────────────────────────────────────────
type GeoTab = "france" | "world" | "quiz";

export default function GeoChallenge() {
  const { lang } = useApp();
  const L = (en: string, fr: string) => lang === "fr" ? fr : en;
  const [tab, setTab] = useState<GeoTab>("france");
  const { s, level, correct: addCorrect, wrong: addWrong, reset } = useScore();

  const tabs: { id: GeoTab; label: string; labelFr: string; icon: React.ReactNode; desc: string; descFr: string }[] = [
    { id: "france", label: "France Map", labelFr: "Carte de France", icon: <Globe size={15} />, desc: "All 13 regions · 101 departments", descFr: "13 régions · 101 départements" },
    { id: "world", label: "World Maritime", labelFr: "Maritime Mondial", icon: <Anchor size={15} />, desc: "28 ports · 9 straits · 7 canals", descFr: "28 ports · 9 détroits · 7 canaux" },
    { id: "quiz", label: "Knowledge Quiz", labelFr: "Quiz de Connaissances", icon: <BookOpen size={15} />, desc: "Timer · 30+ questions · XP", descFr: "Chrono · 30+ questions · XP" },
  ];

  return (
    <div>
      <ScorePanel s={s} level={level} reset={reset} L={L} />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left border-2 transition-all ${tab === t.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-transparent bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500"}`}>
            <span className={tab === t.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}>{t.icon}</span>
            <div>
              <div className={`font-semibold text-sm ${tab === t.id ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>{lang === "fr" ? t.labelFr : t.label}</div>
              <div className="text-[11px] text-slate-400">{lang === "fr" ? t.descFr : t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        {tab === "france" && <FranceMapTab L={L} addCorrect={addCorrect} addWrong={addWrong} />}
        {tab === "world" && <WorldMapTab L={L} addCorrect={addCorrect} addWrong={addWrong} />}
        {tab === "quiz" && <QuizTab L={L} addCorrect={addCorrect} addWrong={addWrong} />}
      </div>
    </div>
  );
}
