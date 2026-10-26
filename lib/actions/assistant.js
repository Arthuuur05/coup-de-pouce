"use server";

import { profilConnecte } from "../profil";
import { chargerFil } from "../donnees-annonces";
import { comprendre, resume, classer, liensSansResultat, TEXTE_AIDE, EXEMPLES_ASSISTANT } from "../aide/assistant";
import { signature, dateRelative } from "../annonces";

const MAX_RESULTATS = 5;

// Ce qu'on renvoie à l'écran : du texte et des annonces réduites au nécessaire (pas de coordonnées, pas d'identifiants d'auteur).
const carte = (a) => ({
  id: a.id,
  type: a.type,
  categorie: a.categorie,
  titre: a.titre,
  extrait: a.description.length > 110 ? `${a.description.slice(0, 107).trimEnd()}…` : a.description,
  auteur: signature(a.auteurProfil),
  prenom: a.auteurProfil?.prenom ?? "",
  photoUrl: a.auteurProfil?.photoUrl ?? null,
  photo: a.photoUrl ?? null,
  date: dateRelative(a.cree_le),
  quand: a.quand ?? "",
  momentTrouve: Boolean(a.momentTrouve),
});

// Une question de l'étudiant → une réponse. Pas de modèle d'IA : voir lib/aide/assistant.js.
export async function poserQuestion(texte) {
  const profil = await profilConnecte();
  if (!profil) return { texte: "Connecte-toi pour utiliser l'assistant.", annonces: [], liens: [] };
  const c = comprendre(texte, { campusMoi: profil.campus });

  if (c.intention === "aide") {
    return {
      texte: `${c.salut ? "Salut ! " : ""}${TEXTE_AIDE}`,
      annonces: [],
      liens: [],
      exemples: EXEMPLES_ASSISTANT,
    };
  }
  if (c.intention === "ecran") {
    return { texte: "Voilà où ça se passe :", annonces: [], liens: [{ href: c.ecran.href, libelle: c.ecran.libelle }] };
  }
  if (c.intention === "inconnu") {
    return {
      texte:
        "Je n'ai pas compris. Essaie avec une matière, un outil ou une catégorie, par exemple « qui peut m'aider en maths ce week-end ? ». Je ne suis pas une intelligence artificielle : je reconnais surtout des mots-clés.",
      annonces: [],
      liens: [],
      exemples: EXEMPLES_ASSISTANT,
    };
  }

  // Recherche : les 30 plus récentes avec les filtres, et celles qui contiennent le mot principal (pour ne pas rater les plus anciennes).
  const filtres = { type: c.filtres.type, categorie: c.filtres.categorie, campus: c.filtres.campus, page: 1 };
  const motPrincipal = c.mots.synonymes[0] ?? c.mots.libres[0] ?? "";
  const [recents, avecMot] = await Promise.all([
    chargerFil(filtres, profil, []),
    motPrincipal ? chargerFil({ ...filtres, q: motPrincipal }, profil, []) : Promise.resolve({ annonces: [], erreur: false }),
  ]);
  if (recents.erreur && avecMot.erreur) {
    return { texte: "Je n'arrive pas à lire les annonces pour l'instant. Réessaie dans un instant.", annonces: [], liens: [] };
  }
  const uniques = new Map([...avecMot.annonces, ...recents.annonces].map((a) => [a.id, a]));
  // Mes propres annonces n'ont pas à m'être proposées.
  const candidates = [...uniques.values()].filter((a) => a.auteur !== profil.id);
  const { exactes, proches } = classer(candidates, c);
  const comprisTexte = resume(c);

  if (exactes.length) {
    return {
      compris: comprisTexte,
      texte: `${exactes.length > MAX_RESULTATS ? `Voilà les ${MAX_RESULTATS} plus pertinentes sur ${exactes.length}` : `J'ai trouvé ${exactes.length} annonce${exactes.length > 1 ? "s" : ""}`} :`,
      annonces: exactes.slice(0, MAX_RESULTATS).map(carte),
      liens: exactes.length > MAX_RESULTATS ? [{ href: lienFil(c), libelle: "Voir toutes les annonces correspondantes" }] : [],
    };
  }
  if (proches.length) {
    return {
      compris: comprisTexte,
      texte: `Je n'ai rien trouvé qui parle exactement de ça, mais voilà des annonces de la catégorie ${c.filtres.categorie} :`,
      annonces: proches.slice(0, 3).map(carte),
      liens: liensSansResultat(c),
    };
  }
  return {
    compris: comprisTexte,
    texte: "Je n'ai rien trouvé pour l'instant. Tu peux être prévenu dès qu'une annonce correspondra, ou publier la tienne :",
    annonces: [],
    liens: liensSansResultat(c),
  };
}

function lienFil(c) {
  const params = new URLSearchParams();
  const mot = c.mots.synonymes[0] ?? c.mots.libres[0] ?? "";
  if (mot) params.set("q", mot);
  for (const cle of ["type", "categorie", "campus"]) if (c.filtres[cle]) params.set(cle, c.filtres[cle]);
  return `/annonces?${params}`;
}
