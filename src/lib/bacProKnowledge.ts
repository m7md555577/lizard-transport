export interface BacProKnowledgeEntry {
  keywords: string[];
  answer: string;
}

const entry = (keywords: string[], answer: string): BacProKnowledgeEntry => ({ keywords, answer });

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const maritimeEntries: BacProKnowledgeEntry[] = [
  entry(["baf", "bunker adjustment factor"], `**BAF — Bunker Adjustment Factor**\n\nLe BAF est un supplément lié au prix du carburant utilisé par le navire.\n\n**Exemple :** si le fret de base est de 800 € et que le BAF est de 10 %, le BAF vaut 80 €.\n\nPour un exercice, applique toujours le taux et la formule donnés.`),
  entry(["caf", "currency adjustment factor"], `**CAF — Currency Adjustment Factor**\n\nLe CAF est un supplément ou une correction liée au taux de change entre les monnaies.\n\n**Exemple :** avec un fret de base de 800 € et un CAF de 5 %, le CAF vaut 40 €.\n\nLe taux de l'exercice est prioritaire.`),
  entry(["fret maritime", "transport maritime", "fret mer"], `**Fret maritime**\n\nC'est le prix du transport de la marchandise par bateau, souvent calculé avec une unité payante (UP).\n\n**Exemple :** une marchandise est transportée du port de Marseille au port de Tanger.`),
  entry(["fret de base", "base freight"], `**Fret de base**\n\nC'est le prix principal du transport avant les éventuels suppléments comme le BAF ou le CAF.\n\n**Données :** nombre d'UP et tarif par UP indiqués dans l'exercice.\n\n**Formule :** fret de base = nombre d'UP × tarif par UP, si cette formule est donnée.\n\n**Calcul :** remplace les données de l'exercice dans la formule.\n\n**Résultat :** montant du fret de base en euros.`),
  entry(["fret total", "total du fret"], `**Fret total**\n\nC'est le montant final demandé par l'exercice après avoir additionné les éléments prévus.\n\n**Données :** fret de base, BAF, CAF et autres frais prévus.\n\n**Formule :** fret total = fret de base + BAF + CAF, uniquement si l'exercice donne cette composition.\n\n**Calcul :** additionne seulement les éléments demandés.\n\n**Résultat :** montant total en euros.`),
  entry(["up", "unite payante", "unites payantes"], `**UP — Unité Payante**\n\nL'UP est l'unité utilisée pour facturer un transport maritime. Selon l'exercice, elle peut être basée sur le poids, le volume ou la plus grande des deux valeurs.\n\n**Données :** poids et volume indiqués dans l'exercice.\n\n**Formule :** utilise exactement la règle donnée. Si l'énoncé indique **UP = max(poids en tonnes, volume en m³)**, prends la plus grande valeur.\n\n**Calcul :** remplace les données dans la formule de l'exercice.\n\n**Résultat :** nombre d'UP.\n\nNe remplace jamais la formule de l'exercice par une autre.`),
  entry(["bl", "bill of lading", "connaissement", "connaissement maritime"], `**BL — Bill of Lading / connaissement maritime**\n\nLe BL est le document du transport maritime. Il décrit la marchandise, le chargeur, le destinataire, le navire et les ports.\n\n**Exemple :** le BL accompagne une expédition de conteneurs entre deux ports.`),
  entry(["fcl", "full container load", "conteneur complet"], `**FCL — Full Container Load**\n\nLe conteneur est réservé pour une seule expédition ou un seul client.\n\n**Exemple :** une entreprise remplit un conteneur de 40 pieds avec ses propres marchandises.`),
  entry(["lcl", "less than container load", "groupage maritime"], `**LCL — Less than Container Load**\n\nLa marchandise est en groupage : plusieurs clients partagent le même conteneur.\n\n**Exemple :** quelques palettes d'une entreprise sont regroupées avec celles d'autres clients.`),
  entry(["evp", "teu", "équivalent vingt pieds", "equivalent vingt pieds"], `**EVP / TEU**\n\nEVP signifie « équivalent vingt pieds ». C'est une unité pour compter la capacité des conteneurs.\n\n**Exemple :** un conteneur de 20 pieds = 1 EVP ; un conteneur de 40 pieds = 2 EVP.`),
  entry(["conteneur 20 pieds", "conteneur 20 pied", "20 pieds"], `**Conteneur 20 pieds**\n\nC'est un conteneur standard d'environ 20 pieds. Il correspond à **1 EVP**.\n\n**Exemple :** une réservation de 2 conteneurs de 20 pieds représente 2 EVP.`),
  entry(["conteneur 40 pieds", "conteneur 40 pied", "40 pieds"], `**Conteneur 40 pieds**\n\nC'est un conteneur standard d'environ 40 pieds. Il correspond généralement à **2 EVP**.\n\n**Exemple :** 1 conteneur de 40 pieds = 2 EVP.`),
  entry(["thc", "terminal handling charge", "frais de terminal"], `**THC — Terminal Handling Charge**\n\nLe THC correspond aux frais de manutention du conteneur dans le terminal portuaire.\n\n**Exemple :** le terminal facture la prise en charge du conteneur à son arrivée ou à son départ.`),
  entry(["pré-acheminement", "pre-acheminement", "pre acheminement"], `**Pré-acheminement**\n\nC'est le transport avant le trajet principal, par exemple de l'entreprise jusqu'au port de départ.\n\n**Exemple :** un camion transporte la marchandise de Lyon au port de Marseille.`),
  entry(["post-acheminement", "post acheminement"], `**Post-acheminement**\n\nC'est le transport après le trajet principal, par exemple du port d'arrivée jusqu'au destinataire.\n\n**Exemple :** après le bateau, un camion livre le conteneur du port au client.`),
  entry(["port de départ", "port depart", "port origine"], `**Port de départ**\n\nC'est le port où commence le transport maritime et où la marchandise est chargée sur le navire.\n\n**Exemple :** Marseille peut être le port de départ.`),
  entry(["port d'arrivée", "port arrivee", "port destination"], `**Port d'arrivée**\n\nC'est le port où se termine le trajet maritime et où la marchandise est déchargée.\n\n**Exemple :** Tanger peut être le port d'arrivée.`),
  entry(["port de transbordement", "transbordement"], `**Port de transbordement**\n\nC'est un port intermédiaire où la marchandise passe d'un navire à un autre.\n\n**Exemple :** un conteneur peut changer de navire dans un port de transbordement avant d'arriver à destination.`),
];

const airEntries: BacProKnowledgeEntry[] = [
  entry(["fret aérien", "fret aerien", "transport aérien", "transport aerien"], `**Fret aérien**\n\nC'est le transport de marchandises par avion. Il est rapide, mais son tarif est souvent plus élevé que par route ou par mer.\n\n**Exemple :** une pièce urgente peut être envoyée par fret aérien.`),
  entry(["awb", "air waybill", "lettre de transport aérien", "lettre de transport aerien"], `**AWB — Air Waybill**\n\nL'AWB est le document du transport aérien. Il indique l'expéditeur, le destinataire, les marchandises et le trajet.\n\n**Exemple :** l'AWB accompagne une expédition entre Paris et Montréal.`),
  entry(["poids réel", "poids reel"], `**Poids réel**\n\nC'est le poids mesuré de la marchandise, généralement en kilogrammes.\n\n**Exemple :** une caisse posée sur une balance pèse 120 kg : son poids réel est 120 kg.`),
  entry(["poids volumétrique", "poids volumetrique"], `**Poids volumétrique**\n\nC'est un poids calculé à partir du volume. Il représente la place occupée dans l'avion.\n\n**Données :** volume et diviseur donnés dans l'exercice.\n\n**Formule :** poids volumétrique = volume ÷ diviseur.\n\n**Calcul :** remplace les données dans la formule.\n\n**Résultat :** poids volumétrique en kg.`),
  entry(["poids taxable", "poids taxé", "poids taxe"], `**Poids taxable**\n\nC'est le poids utilisé pour calculer le tarif aérien.\n\n**Données :** poids réel et poids volumétrique.\n\n**Formule :** compare les deux poids selon la règle donnée dans l'exercice. Dans la règle courante, poids taxable = le plus grand des deux.\n\n**Calcul :** applique la comparaison demandée.\n\n**Résultat :** poids taxable en kg.`),
  entry(["volume aérien", "volume aerien", "calculer le volume", "calcule le volume", "volume"], `**Volume**\n\n**Données :** longueur, largeur et hauteur dans la même unité.\n\n**Formule :** volume = longueur × largeur × hauteur.\n\n**Calcul :** remplace les trois dimensions dans la formule. Si elles sont en centimètres, convertis en m³ si l'exercice le demande.\n\n**Résultat :** volume dans l'unité demandée.\n\n**Exemple :** 2 m × 1 m × 0,5 m = 1 m³.`),
  entry(["tarif aérien", "tarif aerien"], `**Tarif aérien**\n\nC'est le prix appliqué au poids taxable, souvent en €/kg.\n\n**Données :** poids taxable et tarif en €/kg.\n\n**Formule :** coût = poids taxable × tarif aérien.\n\n**Calcul :** 80 kg × 3 €/kg.\n\n**Résultat :** 240 € dans cet exemple. Le tarif et la règle de l'exercice sont toujours prioritaires.`),
];

const roadEntries: BacProKnowledgeEntry[] = [
  entry(["fret routier", "transport routier"], `**Fret routier**\n\nC'est le transport de marchandises par camion ou véhicule routier.\n\n**Exemple :** un camion transporte des palettes de Lille à Lyon.`),
  entry(["cmr", "lettre de voiture", "lettre voiture"], `**CMR — lettre de voiture**\n\nLa CMR est le document utilisé pour un transport routier, surtout international. Elle identifie l'expéditeur, le destinataire, le transporteur, la marchandise, le chargement et la livraison.\n\n**Exemple :** le conducteur présente la CMR lors de la livraison et fait signer le destinataire.`),
  entry(["distance", "kilomètre", "kilometre"], `**Distance**\n\nLa distance est le nombre de kilomètres entre le lieu d'enlèvement et le lieu de livraison.\n\n**Calcul simple :** un coût total ÷ un coût kilométrique peut donner une distance, selon les données de l'exercice.`),
  entry(["itinéraire", "itineraire"], `**Itinéraire**\n\nC'est le chemin prévu entre le départ et l'arrivée.\n\n**Exemple :** l'itinéraire Paris–Lyon peut passer par l'autoroute A6.`),
  entry(["livraison"], `**Livraison**\n\nLa livraison est la remise de la marchandise au destinataire, au lieu prévu.\n\n**Exemple :** le client vérifie les colis et signe la CMR.`),
  entry(["enlèvement", "enlevement"], `**Enlèvement**\n\nL'enlèvement est la prise en charge de la marchandise chez l'expéditeur.\n\n**Exemple :** le camion enlève 8 palettes chez le fournisseur.`),
  entry(["tournée"], `**Tournée**\n\nUne tournée regroupe plusieurs enlèvements ou livraisons réalisés par le même véhicule.\n\n**Exemple :** un conducteur livre trois clients dans la même matinée.`),
  entry(["charge utile"], `**Charge utile**\n\nLa charge utile est le poids maximum de marchandises que le véhicule peut transporter.\n\n**Formule fréquente :** PTAC − poids à vide.\n\nVérifie la formule et les valeurs de l'exercice.`),
  entry(["ptac"], `**PTAC — Poids Total Autorisé en Charge**\n\nC'est le poids maximum autorisé du véhicule chargé : véhicule, conducteur, carburant et marchandise compris.\n\n**Exemple :** un véhicule avec un PTAC de 3,5 t ne doit pas dépasser 3,5 t au total.`),
  entry(["ptra"], `**PTRA — Poids Total Roulant Autorisé**\n\nC'est le poids maximum autorisé de l'ensemble véhicule tracteur + remorque, lorsqu'il y en a une.\n\n**Exemple :** on compare le poids réel de l'ensemble au PTRA indiqué par le constructeur.`),
  entry(["poids brut"], `**Poids brut**\n\nC'est le poids de la marchandise avec son emballage.\n\n**Exemple :** produit 100 kg + emballage 5 kg = poids brut 105 kg.`),
  entry(["poids net"], `**Poids net**\n\nC'est le poids de la marchandise sans son emballage.\n\n**Exemple :** si le brut est 105 kg et l'emballage 5 kg, le net est 100 kg.`),
  entry(["péage", "peage"], `**Péage**\n\nLe péage est le prix payé pour utiliser certaines autoroutes ou infrastructures.\n\n**Calcul simple :** distance à péage × tarif au kilomètre, si l'exercice donne un tarif kilométrique.`),
  entry(["carburant", "gazole", "diesel"], `**Carburant**\n\nLe carburant permet au véhicule de rouler. Pour calculer sa consommation, on utilise la distance, la consommation en L/100 km et le prix du litre.\n\n**Formule fréquente :** litres consommés = distance × consommation ÷ 100.`),
  entry(["coût kilométrique", "cout kilometrique", "coût au kilomètre", "cout au kilometre"], `**Coût kilométrique**\n\nC'est le coût du transport pour un kilomètre.\n\n**Formule :** coût kilométrique = coût total ÷ distance.\n\n**Exemple :** 600 € pour 300 km = 2 €/km.`),
  entry(["temps de conduite", "conduite"], `**Temps de conduite**\n\nC'est le temps pendant lequel le conducteur conduit le véhicule. Dans un exercice, additionne les temps de conduite des différentes étapes.`),
  entry(["temps de repos", "repos"], `**Temps de repos**\n\nC'est une période pendant laquelle le conducteur ne travaille pas et récupère. L'exercice peut demander de le distinguer du temps de pause.`),
  entry(["temps de pause", "pause"], `**Temps de pause**\n\nC'est un arrêt prévu pendant le travail ou la conduite. La durée et le moment à respecter sont ceux indiqués dans le cours ou l'exercice.`),
];

const documentEntries: BacProKnowledgeEntry[] = [
  entry(["document cmr", "cmr document"], `**CMR**\n\nLa CMR est la lettre de voiture du transport routier. Elle sert à décrire l'envoi et à suivre la prise en charge et la livraison.`),
  entry(["document bl", "bl document"], `**BL — Bill of Lading / connaissement**\n\nLe BL est le document du transport maritime. Il décrit la marchandise et le transport par navire.`),
  entry(["document awb", "awb document"], `**AWB — Air Waybill**\n\nL'AWB est le document du transport aérien. Il accompagne la marchandise et précise les parties et le trajet.`),
  entry(["facture commerciale", "facture commercial"], `**Facture commerciale**\n\nElle indique le vendeur, l'acheteur, les marchandises, les quantités et le prix. Elle sert notamment à la vente et aux formalités douanières.`),
  entry(["packing list", "liste de colisage", "liste colisage"], `**Packing list — liste de colisage**\n\nElle détaille les colis : nombre, contenu, poids et dimensions. Elle aide à contrôler l'expédition.`),
  entry(["document douanier", "documents douaniers", "document douane"], `**Document douanier**\n\nIl sert à déclarer une marchandise à la douane lors d'une opération concernée par l'import, l'export ou le transit. Le document exact dépend de l'exercice et du pays.`),
];

const customsEntries: BacProKnowledgeEntry[] = [
  entry(["import", "importation"], `**Import**\n\nImporter, c'est faire entrer une marchandise dans un pays depuis l'étranger.\n\n**Exemple :** une entreprise française achète des marchandises en dehors de l'Union européenne.`),
  entry(["export", "exportation"], `**Export**\n\nExporter, c'est faire sortir une marchandise d'un pays vers l'étranger.\n\n**Exemple :** une entreprise française vend une marchandise à un client hors de France.`),
  entry(["transit"], `**Transit**\n\nLe transit permet à une marchandise de traverser un territoire sous contrôle douanier avant sa destination finale.\n\n**Exemple :** une marchandise passe par un pays sans y être mise en libre pratique.`),
  entry(["douane", "dédouanement", "dedouanement"], `**Douane**\n\nLa douane contrôle les marchandises qui entrent ou sortent d'un territoire et vérifie les déclarations et les taxes éventuelles.`),
  entry(["tva", "taxe sur la valeur ajoutée"], `**TVA**\n\nLa TVA est une taxe appliquée à la vente ou à l'importation selon les règles du pays concerné.\n\nDans un exercice, utilise le taux donné.`),
  entry(["droits de douane", "droit de douane", "droits douaniers"], `**Droits de douane**\n\nCe sont des taxes pouvant être dues lors de l'importation. Leur montant dépend notamment de la marchandise, de son origine et du tarif indiqué dans l'exercice.`),
  entry(["eori"], `**EORI**\n\nL'EORI est un numéro d'identification utilisé par les entreprises pour les opérations douanières dans l'Union européenne.`),
  entry(["code hs", "code douanier", "hs code", "code tarifaire"], `**Code HS / code douanier**\n\nC'est le code qui identifie la catégorie d'une marchandise pour la douane.\n\n**Exemple :** le code aide à déterminer les formalités et les droits éventuels.`),
];

const incotermData = [
  ["EXW", "À l'usine", "acheteur", "vendeur : met la marchandise à disposition dans ses locaux", "dans les locaux du vendeur", "l'acheteur organise généralement l'export et l'import", "L'acheteur vient chercher la marchandise chez le vendeur."],
  ["FCA", "Franco transporteur", "acheteur", "vendeur : remet la marchandise au transporteur convenu et s'occupe de l'export", "à la remise au transporteur", "le vendeur fait l'export ; l'acheteur organise l'import", "Le vendeur remet les palettes au transporteur à son entrepôt."],
  ["CPT", "Port payé jusqu'à", "vendeur paie le transport principal", "vendeur : organise et paie le transport jusqu'au lieu convenu", "à la remise au premier transporteur", "vendeur export ; acheteur import", "Le vendeur paie le trajet jusqu'à Lyon, mais le risque passe au transporteur dès le départ."],
  ["CIP", "Port payé, assurance comprise", "vendeur paie transport + assurance", "vendeur : organise le transport et fournit l'assurance prévue", "à la remise au premier transporteur", "vendeur export ; acheteur import", "Le vendeur envoie la marchandise avec une assurance prévue par le terme."],
  ["DAP", "Rendu au lieu de destination", "vendeur paie jusqu'à destination", "vendeur : transporte jusqu'au lieu convenu ; acheteur décharge", "à l'arrivée, avant le déchargement", "vendeur export ; acheteur import", "Le camion arrive chez le client ; le client s'occupe du déchargement et de l'import."],
  ["DPU", "Rendu au lieu de destination déchargé", "vendeur paie jusqu'à destination", "vendeur : transporte et décharge au lieu convenu", "après le déchargement à destination", "vendeur export ; acheteur import", "Le vendeur livre et décharge les palettes dans le lieu prévu."],
  ["DDP", "Rendu droits acquittés", "vendeur paie presque tout", "vendeur : organise le transport et prend en charge l'export, l'import et les droits prévus", "à destination, après les formalités prévues", "vendeur export et import ; acheteur reçoit", "Le vendeur livre la marchandise au client avec les droits d'importation pris en charge."],
  ["FAS", "Franco le long du navire", "acheteur paie le transport maritime", "vendeur : place la marchandise le long du navire au port de départ", "le long du navire", "vendeur export ; acheteur import", "Le vendeur amène la marchandise sur le quai à côté du navire."],
  ["FOB", "Franco à bord", "acheteur paie le transport maritime", "vendeur : charge la marchandise à bord du navire au port de départ", "à bord du navire", "vendeur export ; acheteur import", "Le vendeur charge le conteneur sur le navire ; l'acheteur paie le fret maritime."],
  ["CFR", "Coût et fret", "vendeur paie le fret maritime", "vendeur : paie le transport jusqu'au port d'arrivée", "à bord du navire au départ", "vendeur export ; acheteur import", "Le vendeur paie le bateau jusqu'au port d'arrivée, mais le risque passe au départ."],
  ["CIF", "Coût, assurance et fret", "vendeur paie fret + assurance", "vendeur : paie le fret maritime et l'assurance prévue jusqu'au port d'arrivée", "à bord du navire au départ", "vendeur export ; acheteur import", "Le vendeur paie le transport et l'assurance jusqu'au port d'arrivée."],
] as const;

const incotermEntries = incotermData.map(([code, name, payer, responsibility, risk, customs, example]) =>
  entry(
    [code.toLowerCase(), name.toLowerCase()],
    `**${code} — ${name}**\n\n- **Qui paie le transport ?** ${payer}.\n- **Qui est responsable ?** ${responsibility}.\n- **Quand le risque change ?** ${risk}.\n- **Export / import :** ${customs}.\n- **Exemple :** ${example}\n\nCette explication est volontairement simple pour un exercice de Bac Pro.`
  )
);

export const BAC_PRO_KB: BacProKnowledgeEntry[] = [
  ...maritimeEntries,
  ...airEntries,
  ...roadEntries,
  ...documentEntries,
  ...customsEntries,
  ...incotermEntries,
  entry(["calcul transport", "calculateur transport", "aide calcul", "bac pro transport"], `Je peux t'aider avec les calculs de base en transport : volume, poids volumétrique, poids taxable, UP, fret de base, BAF, CAF, fret total, carburant et coût kilométrique.\n\nPour un exercice, envoie les données et la formule imposée. Je répondrai : **Données → Formule → Calcul → Résultat**.`),
];

const parseNumber = (value: string) => {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const numberAfter = (text: string, labels: string[]) => {
  const pattern = new RegExp(`(?:${labels.join("|")})[^0-9]{0,24}(\\d+(?:[\\s]\\d{3})*(?:[.,]\\d+)?)`, "i");
  const match = text.match(pattern);
  return match ? parseNumber(match[1]) : null;
};

const percentIn = (text: string) => {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? parseNumber(match[1]) : null;
};

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: decimals });

const dimensionsIn = (text: string) => {
  const multiplication = text.match(/(\d+(?:[.,]\d+)?)\s*(?:x|×|\*)\s*(\d+(?:[.,]\d+)?)\s*(?:x|×|\*)\s*(\d+(?:[.,]\d+)?)/i);
  if (multiplication) {
    return multiplication.slice(1).map(parseNumber) as [number | null, number | null, number | null];
  }
  const values = [...text.matchAll(/\d+(?:[.,]\d+)?/g)].map(match => parseNumber(match[0])).filter((value): value is number => value !== null);
  return values.length >= 3 ? [values[0], values[1], values[2]] : null;
};

const calculation = (title: string, data: string, formula: string, work: string, result: string) =>
  `**${title}**\n\n**Données :** ${data}\n\n**Formule :** ${formula}\n\n**Calcul :** ${work}\n\n**Résultat :** ${result}\n\nVérifie toujours la formule, le tarif et les unités indiqués dans ton exercice.`;

export function getBacProCalculation(message: string): string | null {
  const text = normalize(message);
  const asksForCalculation = /(calcul|calcule|calculer|combien|quel est|quelle est|donnees|donnee)/.test(text);

  if ((text.includes("volume") || text.includes("volume aerien")) && asksForCalculation) {
    const dimensions = dimensionsIn(text);
    if (dimensions && dimensions.every(value => value !== null)) {
      const [length, width, height] = dimensions as [number, number, number];
      const rawVolume = length * width * height;
      const volume = text.includes("cm") ? rawVolume / 1_000_000 : rawVolume;
      return calculation(
        "Calcul du volume",
        `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)}`,
        "Volume = longueur × largeur × hauteur",
        `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)}${text.includes("cm") ? " ÷ 1 000 000" : ""}`,
        `${formatNumber(volume)} m³`
      );
    }
  }

  if ((text.includes("poids volumetrique") || text.includes("poids taxable")) && asksForCalculation) {
    const dimensions = dimensionsIn(text);
    const divisor = numberAfter(text, ["diviseur", "divisor"]);
    if (dimensions && dimensions.every(value => value !== null) && divisor) {
      const [length, width, height] = dimensions as [number, number, number];
      const rawVolume = length * width * height;
      const volume = text.includes("cm") ? rawVolume / 1_000_000 : rawVolume;
      const volumetricWeight = volume / divisor;
      const realWeight = numberAfter(text, ["poids reel", "poids reel de", "poids physique"]);
      if (text.includes("poids taxable") && realWeight !== null) {
        const taxable = Math.max(realWeight, volumetricWeight);
        return calculation(
          "Calcul du poids taxable",
          `poids réel = ${formatNumber(realWeight)} kg ; volume = ${formatNumber(volume)} m³ ; diviseur = ${formatNumber(divisor)}`,
          "poids volumétrique = volume ÷ diviseur ; poids taxable = le plus grand des deux, si l'exercice le prévoit",
          `${formatNumber(volume)} ÷ ${formatNumber(divisor)} = ${formatNumber(volumetricWeight)} kg ; max(${formatNumber(realWeight)}, ${formatNumber(volumetricWeight)})`,
          `${formatNumber(taxable)} kg`
        );
      }
      return calculation(
        "Calcul du poids volumétrique",
        `volume = ${formatNumber(volume)} m³ ; diviseur = ${formatNumber(divisor)}`,
        "Poids volumétrique = volume ÷ diviseur",
        `${formatNumber(volume)} ÷ ${formatNumber(divisor)}`,
        `${formatNumber(volumetricWeight)} kg`
      );
    }
  }

  if ((text.includes("up") || text.includes("unite payante")) && asksForCalculation) {
    const weight = numberAfter(text, ["poids"]);
    const volume = numberAfter(text, ["volume"]);
    const usesMaxRule = text.includes("max") || text.includes("plus grand");
    if (weight !== null && volume !== null && usesMaxRule) {
      const up = Math.max(weight, volume);
      return calculation(
        "Calcul de l'UP",
        `poids = ${formatNumber(weight)} t ; volume = ${formatNumber(volume)} m³`,
        "UP = max(poids en tonnes, volume en m³), uniquement si cette règle est donnée",
        `max(${formatNumber(weight)}, ${formatNumber(volume)})`,
        `${formatNumber(up)} UP`
      );
    }
  }

  if (text.includes("fret de base") && asksForCalculation) {
    const up = numberAfter(text, ["up", "unites payantes"]);
    const rate = numberAfter(text, ["tarif", "prix", "par up"]);
    if (up !== null && rate !== null) {
      return calculation(
        "Calcul du fret de base",
        `${formatNumber(up)} UP ; tarif = ${formatNumber(rate)} € / UP`,
        "Fret de base = nombre d'UP × tarif par UP, si l'exercice donne cette formule",
        `${formatNumber(up)} × ${formatNumber(rate)}`,
        `${formatNumber(up * rate)} €`
      );
    }
  }

  for (const surcharge of ["baf", "caf"]) {
    if (text.includes(surcharge) && asksForCalculation) {
      const base = numberAfter(text, ["fret de base", "base", "sur"]);
      const rate = percentIn(text);
      if (base !== null && rate !== null) {
        const amount = base * rate / 100;
        return calculation(
          `Calcul du ${surcharge.toUpperCase()}`,
          `base = ${formatNumber(base)} € ; taux = ${formatNumber(rate)} %`,
          `${surcharge.toUpperCase()} = base × taux ÷ 100`,
          `${formatNumber(base)} × ${formatNumber(rate)} ÷ 100`,
          `${formatNumber(amount)} €`
        );
      }
    }
  }

  if (text.includes("fret total") && asksForCalculation) {
    const base = numberAfter(text, ["fret de base", "base"]);
    const baf = numberAfter(text, ["baf"]);
    const caf = numberAfter(text, ["caf"]);
    if (base !== null && baf !== null && caf !== null) {
      return calculation(
        "Calcul du fret total",
        `fret de base = ${formatNumber(base)} € ; BAF = ${formatNumber(baf)} € ; CAF = ${formatNumber(caf)} €`,
        "Fret total = fret de base + BAF + CAF, si l'exercice donne cette composition",
        `${formatNumber(base)} + ${formatNumber(baf)} + ${formatNumber(caf)}`,
        `${formatNumber(base + baf + caf)} €`
      );
    }
  }

  if ((text.includes("cout kilometrique") || text.includes("cout au kilometre")) && asksForCalculation) {
    const total = numberAfter(text, ["cout total", "coût total", "total"]);
    const distance = numberAfter(text, ["distance", "km"]);
    if (total !== null && distance) {
      return calculation(
        "Calcul du coût kilométrique",
        `coût total = ${formatNumber(total)} € ; distance = ${formatNumber(distance)} km`,
        "Coût kilométrique = coût total ÷ distance",
        `${formatNumber(total)} ÷ ${formatNumber(distance)}`,
        `${formatNumber(total / distance)} €/km`
      );
    }
  }

  if (text.includes("carburant") && asksForCalculation) {
    const distance = numberAfter(text, ["distance", "km"]);
    const consumption = numberAfter(text, ["consommation"]);
    if (distance !== null && consumption !== null) {
      const litres = distance * consumption / 100;
      const price = numberAfter(text, ["prix", "litre"]);
      const cost = price !== null ? litres * price : null;
      return calculation(
        "Calcul du carburant",
        `distance = ${formatNumber(distance)} km ; consommation = ${formatNumber(consumption)} L/100 km${price !== null ? ` ; prix = ${formatNumber(price)} €/L` : ""}`,
        "Litres consommés = distance × consommation ÷ 100",
        `${formatNumber(distance)} × ${formatNumber(consumption)} ÷ 100${price !== null ? ` = ${formatNumber(litres)} L ; ${formatNumber(litres)} × ${formatNumber(price)}` : ""}`,
        cost !== null ? `${formatNumber(litres)} L, soit ${formatNumber(cost)} €` : `${formatNumber(litres)} L`
      );
    }
  }

  return null;
}

export function findBacProKnowledge(message: string): BacProKnowledgeEntry | null {
  const text = normalize(message);
  let best: { score: number; entry: BacProKnowledgeEntry | null } = { score: 0, entry: null };

  for (const candidate of BAC_PRO_KB) {
    const score = candidate.keywords
      .map(normalize)
      .filter(keyword => text.includes(keyword))
      .length;
    if (score > best.score) best = { score, entry: candidate };
  }

  return best.entry;
}