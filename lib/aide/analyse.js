// Comprendre une phrase d'étudiant, par règles : le type (je cherche / je propose), la catégorie, la matière ou l'outil,
// le moment, le campus, le trajet d'un covoiturage, la contrepartie, et les mots qui portent le sujet.
// Aucun modèle d'IA : des listes de mots (lexique.js) et des expressions régulières. Ce que ça ne comprend pas, ça le dit.
import { CAMPUS } from "../compte";
import { CATEGORIES } from "../annonces";
import {
  MOTS_CATEGORIES, MATIERES, TECHNOS, SIGNAUX_CHERCHE, SIGNAUX_PROPOSE, JOURS, MOTS_VIDES,
} from "./lexique";
import { plat, mots, reconnait } from "./texte";

const somme = (signaux, p) => signaux.reduce((s, [poids, re]) => s + (re.test(p) ? poids : 0), 0);

// Les catégories reconnues, de la plus probable à la moins probable. Chaque mot compte 2 points (3 s'il est en tête de phrase) ;
// à égalité, la catégorie citée en premier dans la phrase passe devant.
function categories(listeMots) {
  const points = new Map();
  const premiere = new Map();
  listeMots.forEach((m, i) => {
    for (const [categorie, entrees] of Object.entries(MOTS_CATEGORIES)) {
      if (entrees.some((e) => reconnait(m.plat, e))) {
        points.set(categorie, (points.get(categorie) ?? 0) + (i < 2 ? 3 : 2));
        if (!premiere.has(categorie)) premiere.set(categorie, i);
      }
    }
  });
  // « photos soirée asso » : l'événement est le décor, la photo est le service demandé.
  const services = ["Photo", "Vidéo", "Design", "Développement", "Cours et soutien", "Réseaux sociaux"];
  if (points.has("Événementiel") && services.some((s) => points.has(s))) points.set("Événementiel", points.get("Événementiel") / 2);
  return [...points.entries()]
    .sort((a, b) => b[1] - a[1] || premiere.get(a[0]) - premiere.get(b[0]))
    .map(([categorie, score]) => ({ categorie, score }));
}

const trouver = (liste, listeMots) => {
  const trouvees = [];
  for (const [nom, entrees] of liste) {
    if (listeMots.some((m) => entrees.some((e) => m.plat === e || (e.length > 3 && m.plat.startsWith(e)))) && !trouvees.includes(nom)) trouvees.push(nom);
  }
  return trouvees;
};

// « ce week-end », « vendredi soir », « demain », « le 12 novembre »…
function moment(p, brut) {
  const jour = `(?:${JOURS.join("|")})`;
  const regles = [
    new RegExp(`\\b(?:ce\\s+|le\\s+|ce\\s+prochain\\s+)?${jour}(?:\\s+(?:prochain|matin|midi|apres-midi|apres midi|soir|soiree))?\\b`),
    /\b(?:ce\s+|le\s+)?(?:week-end|weekend|week end|we)\b(?:\s+prochain)?/,
    /\bce\s+soir\b|\bdemain(?:\s+(?:matin|midi|soir|apres-midi))?\b|\baujourd'?hui\b|\bapres-demain\b/,
    /\bcette\s+semaine\b|\bla\s+semaine\s+(?:prochaine|pro)\b|\bce\s+mois(?:-ci)?\b|\bdebut\s+de\s+semaine\b|\bfin\s+de\s+semaine\b/,
    /\ble\s+\d{1,2}(?:er)?\s+(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b/,
    /\b\d{1,2}\/\d{1,2}\b/,
    /\b(?:avant|pendant|apres)\s+les\s+(?:partiels|examens|exams|vacances|cours)\b/,
    /\ben\s+(?:soiree|journee|semaine)\b/,
  ];
  for (const re of regles) {
    const m = re.exec(p);
    if (m) return brut.slice(m.index, m.index + m[0].length).trim();
  }
  return "";
}

// Mots de la fenêtre de temps, pour retrouver des annonces qui parlent du même moment.
export function motsDuMoment(texte) {
  const p = plat(texte);
  const t = new Set();
  if (/\b(week-end|weekend|week end|we)\b/.test(p)) ["week-end", "weekend", "samedi", "dimanche"].forEach((x) => t.add(x));
  for (const j of JOURS) if (p.includes(j)) t.add(j);
  if (/\bce soir|demain soir\b/.test(p)) t.add("soir");
  if (/\bdemain\b/.test(p)) t.add("demain");
  if (/\bmatin\b/.test(p)) t.add("matin");
  if (/\bsoir|soiree\b/.test(p)) t.add("soir");
  return [...t];
}

// « contre un café », « en échange d'un coup de main en maths », « pour un verre ».
function contrepartie(p, brut) {
  const m = /\b(?:contre|en\s+echange\s+(?:de|d'|d))\s+((?:(?:un|une|des|du|de\s+la|de\s+l')\s*)?[a-z0-9' -]{2,40}?)(?=[.,;!?]|\s+(?:et|ou|le|la|les|ce|cette|ce|a|au|pour|vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi|demain|ce)\b|$)/.exec(p);
  if (!m) return "";
  const debut = m.index + m[0].indexOf(m[1]);
  const t = brut.slice(debut, debut + m[1].length).trim();
  return t.length >= 2 ? t : "";
}

// Parle-t-on d'argent ? Jamais d'argent sur Coup de Pouce.
const argent = (p) => /(\d\s*(?:€|euros?|eur)\b|€|\brémunér|\bremuner|\bpayant|\bpaye\b|\bpayee?\b|\btarif|\bprix\b|\b\d+\s*e\/h\b)/.test(p);

// « de Lyon à Paris », « Paris → Nantes », « vers Bordeaux ».
function trajet(listeMots, brut, p) {
  const re = /\b(?:de|depuis)\s+([a-z][a-z' -]{1,24}?)\s+(?:a|vers|pour|jusqu'?a)\s+([a-z][a-z' -]{1,24}?)(?=[\s.,;!?]|$)/.exec(p);
  const propre = (t) => t.trim().replace(/\s+(le|la|les|ce|cette|demain|vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi)\b.*$/, "");
  if (re) {
    const a = brut.slice(re.index + re[0].indexOf(re[1]), re.index + re[0].indexOf(re[1]) + re[1].length);
    const b = brut.slice(re.index + re[0].lastIndexOf(re[2]), re.index + re[0].lastIndexOf(re[2]) + re[2].length);
    return { depart: propre(a), arrivee: propre(b) };
  }
  const fleche = /([A-Za-zÀ-ÿ' -]{2,20}?)\s*(?:->|→|=>)\s*([A-Za-zÀ-ÿ' -]{2,20})/.exec(brut);
  if (fleche) return { depart: fleche[1].trim(), arrivee: fleche[2].trim() };
  const vers = /\bvers\s+([a-z][a-z'-]{2,24})/.exec(p);
  if (vers) return { depart: "", arrivee: brut.slice(vers.index + 5, vers.index + 5 + vers[1].length) };
  return null;
}

// Le campus cité (« sur le campus de Lyon », « à Nantes »), ou « mon campus » si la phrase le dit.
function campusCite(p, campusMoi) {
  for (const c of CAMPUS) {
    if (c === "Autre") continue;
    if (new RegExp(`\\b${plat(c)}\\b`).test(p)) return c;
  }
  if (/\b(mon|notre)\s+campus\b/.test(p) && campusMoi) return campusMoi;
  return "";
}

export function analyser(texte, { campusMoi = "" } = {}) {
  const brut = String(texte ?? "").trim();
  const p = plat(brut);
  const lesMots = mots(brut);
  const cherche = somme(SIGNAUX_CHERCHE, p);
  const propose = somme(SIGNAUX_PROPOSE, p);
  const classees = categories(lesMots);
  const matieres = trouver(MATIERES, lesMots);
  const technos = trouver(TECHNOS, lesMots);
  const trajetCite = classees[0]?.categorie === "Covoiturage" || classees.some((c) => c.categorie === "Covoiturage") ? trajet(lesMots, brut, p) : null;

  // Les mots qui portent le sujet : ni mots vides, ni mots qui ne font qu'annoncer la catégorie, ni le moment, ni le campus.
  const horsSujet = new Set([...JOURS, "ce", "week-end", "weekend", ...CAMPUS.map(plat)]);
  const sujet = lesMots.filter(
    (m) => m.plat.length > 2 && !MOTS_VIDES.has(m.plat) && !horsSujet.has(m.plat) && !/^\d+$/.test(m.plat),
  );
  const declencheursChoisis = MOTS_CATEGORIES[classees[0]?.categorie] ?? [];
  const motsSujet = sujet.filter((m) => !declencheursChoisis.some((e) => reconnait(m.plat, e)));

  return {
    texte: brut,
    type: cherche > propose ? "cherche" : propose > cherche ? "propose" : "",
    forceType: Math.abs(cherche - propose),
    categorie: classees[0]?.categorie ?? "",
    autreCategorie: classees[1]?.categorie ?? "",
    categories: classees,
    matieres,
    technos,
    moment: moment(p, brut),
    campus: campusCite(p, campusMoi),
    campusDit: /\bcampus\b/.test(p),
    trajet: trajetCite,
    contrepartie: contrepartie(p, brut),
    argent: argent(p),
    // Mots du sujet, avec leur orthographe d'origine ; les déclencheurs de catégorie en dernier recours.
    sujet: motsSujet.map((m) => m.brut),
    motsCles: sujet.map((m) => m.plat),
    reconnu: Boolean(classees.length || matieres.length || technos.length),
  };
}

export { CATEGORIES };
