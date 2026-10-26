// L'assistant : comprend une question comme « qui peut m'aider en maths ce week-end ? » et la traduit en recherche dans les annonces,
// ou en lien vers un écran de l'appli. Tout se fait par règles (lib/aide/analyse.js), sans modèle d'IA.
// `comprendre` et `classer` ne touchent pas à la base : l'action serveur (lib/actions/assistant.js) fait la recherche.
import { analyser, motsDuMoment } from "./analyse";
import { MATIERES, TECHNOS } from "./lexique";
import { plat } from "./texte";
import { TYPES } from "../annonces";

// Les écrans qu'on peut demander (« où sont mes messages ? »).
const ECRANS = [
  [/\b(demandes?|contacts?)\b/, "/demandes", "Mes demandes"],
  [/\b(messages?|conversations?|discussions?)\b/, "/messages", "Mes messages"],
  [/\b(rendez-vous|calendrier|agenda|rdv|rappels?)\b/, "/calendrier", "Mon calendrier"],
  [/\b(notifications?|alertes?|cloche)\b/, "/notifications", "Mes notifications et alertes"],
  [/\b(badges?|niveaux?|niveau)\b/, "/profil#mes-badges", "Mes badges"],
  [/\b(classement|palmares)\b/, "/classement", "Le classement du campus"],
  [/\b(favoris?)\b/, "/profil#mes-favoris", "Mes favoris"],
  [/\b(publier|poster|deposer|creer\s+une\s+annonce|nouvelle\s+annonce|ajouter\s+une\s+annonce)\b/, "/publier", "Publier une annonce"],
  [/\b(profil|coordonnees|competences|cv|mot\s+de\s+passe|photo\s+de\s+profil)\b/, "/profil", "Mon profil"],
  [/\b(annonces?|fil)\b/, "/annonces", "Les annonces"],
];

const SALUTS = /^(bonjour|salut|coucou|hello|hey|bonsoir|yo)\b/;
const AIDE = /\b(que\s+sais|que\s+peux|sais[\s-]tu|peux[\s-]tu|tu\s+sais\s+faire|comment\s+(ca\s+)?marche|a\s+quoi\s+(tu\s+)?sers?|qui\s+es[\s-]tu|help|aide\s*$|aidez?[\s-]moi\s*$|exemples?)\b/;
const QUI_CHERCHE = /\bqui\s+(cherche|recherche|a\s+besoin|veut|voudrait|demande)\b/;

// Les mots qui comptent pour trouver les annonces, avec leurs synonymes (« maths » → « math », « algebre »…).
function motsAChercher(a) {
  const exacts = new Set();
  for (const [nom, entrees] of [...MATIERES, ...TECHNOS]) {
    if (a.matieres.includes(nom) || a.technos.includes(nom)) entrees.forEach((e) => e.length >= 3 && exacts.add(e));
  }
  const libres = a.motsCles.filter((k) => k.length >= 3);
  return { synonymes: [...exacts], libres: [...new Set(libres)].slice(0, 5) };
}

export function comprendre(texte, { campusMoi = "" } = {}) {
  const brut = String(texte ?? "").trim().slice(0, 200);
  const p = plat(brut);
  const a = analyser(brut, { campusMoi });
  const debutDemande = /^(mes|mon|ma|ou\s|ou\s+est|ou\s+sont|comment|je\s+veux\s+(voir|aller)|montre|affiche|ouvre|va\s+)/.test(p);

  const base = { texte: brut, analyse: a };
  if (!brut) return { ...base, intention: "inconnu" };

  const ecran = ECRANS.find(([re]) => re.test(p));
  if (ecran && (debutDemande || !a.reconnu)) {
    return { ...base, intention: "ecran", ecran: { href: ecran[1], libelle: ecran[2] } };
  }

  const motsLibres = motsAChercher(a);
  if (a.reconnu || motsLibres.libres.length) {
    // Je cherche de l'aide → les annonces « Je propose » ; je propose mon aide → les annonces « Je cherche » ; « qui cherche… ? » → « Je cherche ».
    let type = "";
    if (QUI_CHERCHE.test(p)) type = "cherche";
    else if (a.type === "cherche") type = "propose";
    else if (a.type === "propose") type = "cherche";
    return {
      ...base,
      intention: "recherche",
      filtres: { type, categorie: a.categorie, campus: a.campus },
      mots: motsLibres,
      motsMoment: motsDuMoment(brut),
      categorieSure: Boolean(a.categorie),
    };
  }

  if (SALUTS.test(p) || AIDE.test(p)) return { ...base, intention: "aide", salut: SALUTS.test(p) };
  return { ...base, intention: "inconnu" };
}

// La phrase « J'ai compris : … », pour que la personne voie ce qui a été retenu (et corrige si c'est faux).
export function resume(c) {
  const f = c.filtres;
  const a = c.analyse;
  const sujet = [...a.matieres, ...a.technos];
  const autresMots = a.sujet; // les mots du sujet, avec leur orthographe, sans ceux qui ne font qu'annoncer la catégorie
  const morceaux = [];
  if (f.type === "propose") morceaux.push("tu cherches de l'aide (annonces « Je propose »)");
  else if (f.type === "cherche") morceaux.push("tu veux voir qui a besoin d'un coup de main (annonces « Je cherche »)");
  else morceaux.push("tu cherches dans toutes les annonces");
  if (f.categorie) morceaux.push(`catégorie ${f.categorie}`);
  if (sujet.length) morceaux.push(sujet.join(", "));
  if (autresMots.length && !sujet.length) morceaux.push(`mots : ${autresMots.join(", ")}`);
  if (f.campus) morceaux.push(`campus ${f.campus}`);
  if (a.moment) morceaux.push(`${a.moment} (je regarde si les annonces en parlent)`);
  return `J'ai compris : ${morceaux.join(" · ")}.`;
}

const texteAnnonce = (an) => plat(`${an.titre} ${an.description} ${an.quand ?? ""} ${an.contrepartie ?? ""}`);

// Classe les annonces : celles qui parlent vraiment du sujet (mot trouvé dans le titre, la description ou le « quand »),
// puis les « proches » (bonne catégorie, mais le sujet n'y est pas).
export function classer(annonces, c) {
  const { synonymes, libres } = c.mots;
  const recherches = [...new Set([...synonymes, ...libres])];
  // Un sujet précis (une matière, un outil) est exigé ; sinon la catégorie suffit, et les mots ne servent qu'à classer.
  // Sans catégorie, les mots libres sont exigés (sinon on montrerait tout le fil).
  const requis = synonymes.length ? synonymes : c.categorieSure ? [] : libres;
  const notees = annonces.map((an) => {
    const titre = plat(an.titre);
    const tout = texteAnnonce(an);
    let score = 0;
    for (const k of recherches) {
      if (titre.includes(k)) score += 3;
      else if (tout.includes(k)) score += 2;
    }
    const quand = plat(`${an.quand ?? ""} ${an.description}`);
    const bonusMoment = c.motsMoment.some((m) => quand.includes(m)) ? 2 : 0;
    const parle = !requis.length || requis.some((k) => tout.includes(k));
    return { an, score: score + bonusMoment, bonusMoment, parle };
  });
  const exactes = notees
    .filter((n) => n.parle)
    .sort((x, y) => y.score - x.score || new Date(y.an.cree_le) - new Date(x.an.cree_le))
    .map((n) => ({ ...n.an, momentTrouve: n.bonusMoment > 0 }));
  const proches = synonymes.length && c.categorieSure ? notees.filter((n) => !n.parle).map((n) => n.an) : [];
  return { exactes, proches };
}

// Les liens quand il n'y a rien : créer une alerte (le fil propose « Me prévenir »), ou publier sa propre annonce.
export function liensSansResultat(c) {
  const f = c.filtres;
  const alerte = new URLSearchParams();
  const mot = c.mots.libres[0] || c.analyse.matieres[0] || c.analyse.technos[0] || "";
  if (mot) alerte.set("q", mot);
  if (f.type) alerte.set("type", f.type);
  if (f.categorie) alerte.set("categorie", f.categorie);
  if (f.campus) alerte.set("campus", f.campus);
  const publier = new URLSearchParams();
  // Je cherche de l'aide et personne ne propose → je publie une annonce « Je cherche » (et inversement).
  const monType = f.type === "cherche" ? "propose" : "cherche";
  publier.set("type", monType);
  if (f.categorie) publier.set("categorie", f.categorie);
  return [
    alerte.toString() && { href: `/annonces?${alerte}`, libelle: "Voir le fil et créer une alerte (« Me prévenir »)" },
    { href: `/publier?${publier}`, libelle: `Publier une annonce « ${TYPES[monType]} »` },
  ].filter(Boolean);
}

export const EXEMPLES_ASSISTANT = [
  "Qui peut m'aider en maths ce week-end ?",
  "Je cherche un photographe pour une soirée",
  "Qui cherche un coup de main en Python ?",
  "Covoiturage vers Paris",
  "Où sont mes rendez-vous ?",
];

export const TEXTE_AIDE =
  "Je suis un assistant simple, pas une intelligence artificielle : je comprends des phrases courantes (matière, outil, catégorie, campus, jour, « ce week-end »…) et je cherche dans les annonces en ligne. " +
  "Je peux aussi t'emmener vers un écran (« où sont mes messages ? »). " +
  "Je ne sais pas : répondre à des questions générales, écrire à ta place, comprendre des phrases très longues ou très compliquées, ni voir tes demandes ou tes coordonnées.";
