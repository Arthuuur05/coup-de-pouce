// Aide à la rédaction d'une annonce : à partir de quelques mots, propose un type, une catégorie, un titre, une description,
// un moment et une contrepartie. Tout est fabriqué avec des modèles de phrases et des mots-clés, sans modèle d'IA :
// `fournisseurRegles` est le seul endroit à remplacer pour brancher un vrai modèle plus tard (même entrée, même sortie).
import { LIMITES } from "../annonces";
import { analyser } from "./analyse";
import { couper, deMot, premiereMajuscule } from "./texte";

// Les morceaux de phrase de chaque catégorie. `propose` : après « Je peux » ; `cherche` : après « Je cherche ».
// `titres` : jusqu'à trois titres, du plus naturel au plus neutre.
function modele(categorie, type, a) {
  const sujet = a.sujet.join(" ");
  const pour = sujet ? ` : ${sujet}` : ""; // dans un titre : « Photos : soirée asso »
  const deux = pour;
  const entre = sujet ? ` (${sujet})` : ""; // dans une phrase : « faire des photos (soirée asso) »
  const m = a.matieres[0];
  const t = a.technos[0];
  const dessin = a.motsCles.find((k) => ["logo", "affiche", "flyer", "poster", "brochure"].includes(k));
  const trajet = a.trajet?.arrivee ? `${a.trajet.depart ? `${a.trajet.depart} → ` : "vers "}${a.trajet.arrivee}` : "";
  const colloc = a.motsCles.some((k) => k.startsWith("coloc"));
  const propose = type === "propose";
  const ville = a.campus ? ` à ${a.campus}` : "";
  const parcours = a.trajet?.arrivee ? (a.trajet.depart ? `de ${a.trajet.depart} à ${a.trajet.arrivee}` : `vers ${a.trajet.arrivee}`) : "";

  switch (categorie) {
    case "Cours et soutien":
      return {
        action: propose ? (m ? `t'aider en ${m}` : "t'aider pour tes cours") : m ? `un coup de main en ${m}` : "de l'aide pour mes cours",
        titres: propose
          ? m ? [`Cours ${deMot(m)}`, `Aide en ${m}`, `Soutien en ${m}`] : [`Coup de main en cours${deux}`, "Soutien en cours"]
          : m ? [`Cherche aide en ${m}`, `Besoin d'un coup de main en ${m}`, `Coup de pouce en ${m}`] : [`Cherche un coup de main pour mes cours`, "Besoin d'aide en cours"],
        conseils: ["Précise ton niveau (L1, L2…) et la durée d'une séance.", "Dis si c'est pour un partiel, un exposé ou pour comprendre le cours."],
      };
    case "Photo":
      return {
        action: propose ? `faire des photos${entre}` : `quelqu'un pour faire des photos${entre}`,
        titres: propose ? [`Photos${pour}`, `Séance photo${pour}`, `Photographe${pour}`] : [`Cherche photographe${pour}`, `Besoin de photos${pour}`],
        conseils: ["Précise le matériel (reflex, smartphone) et si tu retouches les photos.", "Indique la durée de la séance et le lieu."],
      };
    case "Vidéo":
      return {
        action: propose ? `filmer ou monter une vidéo${entre}` : `quelqu'un pour filmer ou monter une vidéo${entre}`,
        titres: propose ? [`Montage vidéo${pour}`, `Vidéo${pour}`, `Tournage et montage${pour}`] : [`Cherche aide vidéo${pour}`, `Besoin d'un monteur${pour}`],
        conseils: ["Précise le logiciel de montage que tu utilises.", "Indique la durée de la vidéo et le délai."],
      };
    case "Développement":
      return {
        action: propose ? (t ? `t'aider en ${t}${entre}` : `t'aider en code${entre}`) : t ? `quelqu'un qui connaît ${t}${entre}` : `un coup de main en code${entre}`,
        titres: propose
          ? t ? [`Aide en ${t}${pour}`, `Coup de main en ${t}`, `Code : ${t}`] : [`Coup de main en code${pour}`, `Aide en programmation${pour}`]
          : t ? [`Cherche aide en ${t}${pour}`, `Besoin d'un coup de main en ${t}`] : [`Cherche un dev${pour}`, `Besoin d'aide en code${pour}`],
        conseils: ["Précise le langage ou l'outil et ton niveau.", "Pour un bug : dis ce que tu as déjà essayé."],
      };
    case "Design":
      return {
        action: propose
          ? dessin ? `créer un${dessin === "affiche" || dessin === "brochure" ? "e" : ""} ${dessin}${entre}` : `t'aider sur un visuel${entre}`
          : dessin ? `quelqu'un pour un${dessin === "affiche" || dessin === "brochure" ? "e" : ""} ${dessin}${entre}` : `quelqu'un pour un visuel${entre}`,
        titres: propose
          ? dessin === "logo" ? [`Création de logo${pour}`, `Logo et identité${pour}`] : dessin ? [`Création d'${dessin === "affiche" ? "affiche" : dessin}${pour}`, `Design graphique${pour}`] : [`Design graphique${pour}`, `Coup de main design${pour}`]
          : [`Cherche un graphiste${pour}`, dessin ? `Besoin d'un${dessin === "affiche" || dessin === "brochure" ? "e" : ""} ${dessin}${pour}` : `Besoin d'un visuel${pour}`],
        conseils: ["Précise le format (affiche, logo, post…) et ton délai.", "Dis quel logiciel tu utilises (Figma, Canva, Photoshop…)."],
      };
    case "Réseaux sociaux":
      return {
        action: propose ? `t'aider sur tes réseaux sociaux${t ? ` (${t})` : ""}` : `de l'aide sur les réseaux sociaux${t ? ` (${t})` : ""}`,
        titres: propose ? [`Aide réseaux sociaux${t ? ` (${t})` : ""}`, `Coup de main community management`] : [`Cherche aide en réseaux sociaux${pour}`, `Besoin d'un coup de main sur ${t ?? "les réseaux"}`],
        conseils: ["Précise le réseau (Instagram, TikTok, LinkedIn…) et l'objectif.", "Dis si c'est pour une asso, un projet ou un compte perso."],
      };
    case "Logement":
      return {
        action: propose ? (colloc ? "proposer une place en colocation" : "proposer un logement") : colloc ? `une colocation${ville}` : `un logement${ville}`,
        titres: propose
          ? colloc ? ["Place en colocation", "Colocation : une chambre se libère"] : ["Logement à proposer", "Chambre à sous-louer"]
          : colloc ? [`Cherche une colocation${a.campus ? ` à ${a.campus}` : ""}`, "Cherche une place en coloc"] : [`Cherche un logement${a.campus ? ` à ${a.campus}` : ""}`, "Cherche une chambre"],
        conseils: ["Précise le quartier, les dates et le loyer approximatif (en toutes lettres, sans passer par Coup de Pouce).", "Dis combien de personnes sont déjà là."],
      };
    case "Covoiturage":
      return {
        action: propose ? (parcours ? `te prendre en covoiturage ${parcours}` : "proposer un covoiturage") : parcours ? `un covoiturage ${parcours}` : "un covoiturage",
        titres: propose ? [trajet ? `Covoiturage ${trajet}` : `Covoiturage${pour}`, "Places dans ma voiture"] : [trajet ? `Cherche covoiturage ${trajet}` : `Cherche covoiturage${pour}`, "Cherche une place en voiture"],
        conseils: ["Précise l'heure de départ, le point de rendez-vous et le nombre de places.", "Dis si tu peux faire un détour."],
      };
    case "Événementiel":
      return {
        action: propose ? `donner un coup de main pour un événement${entre}` : `des bras en plus pour un événement${entre}`,
        titres: propose ? [`Coup de main pour événement${pour}`, `Aide à l'organisation${pour}`] : [`Cherche des bénévoles${pour}`, `Besoin d'aide pour un événement${pour}`],
        conseils: ["Précise la date, le lieu et le nombre de personnes attendues.", "Dis ce qu'il y a à faire (installation, accueil, son…)."],
      };
    default:
      return {
        action: propose ? `te donner un coup de main${deux}` : `un coup de main${deux}`,
        titres: propose ? [`Coup de main${deux}`, "Je donne un coup de pouce"] : [`Cherche un coup de main${deux}`, "Besoin d'un coup de pouce"],
        conseils: ["Précise ce que tu proposes ou ce dont tu as besoin, avec le plus de détails utiles."],
      };
  }
}

const FIN = {
  propose: "Demande-moi le contact et on s'organise.",
  cherche: "Réponds-moi avec « Je peux t'aider » et on s'organise.",
};

function descriptions(type, a, mod) {
  const propose = type === "propose";
  const debut = propose ? `Je peux ${mod.action}` : `Je cherche ${mod.action}`;
  const quand = a.moment ? ` (${a.moment})` : "";
  const detail = [
    a.moment && `Quand : ${a.moment}.`,
    a.contrepartie && `En échange : ${a.contrepartie}.`,
    a.campusDit && a.campus && `Campus ${a.campus}.`,
  ].filter(Boolean);
  const court = `${debut}${quand}.`;
  const chaleureuse = `Salut ! ${debut}${quand}${propose ? ", avec plaisir" : ""}. ${propose ? "N'hésite pas si ça peut te servir !" : "Merci d'avance, ça me dépanne vraiment !"}`;
  const complete = [`${debut}.`, ...detail, FIN[type]].join(" ");
  return [
    ["Courte", court],
    ["Chaleureuse", chaleureuse],
    ["Complète", complete],
  ].map(([nom, texte]) => [nom, couper(texte, LIMITES.description)]);
}

// L'entrée : ce que la personne a tapé, et ce qu'elle a déjà choisi dans le formulaire.
// La sortie : ce qui a été compris, des propositions complètes, des conseils et d'éventuels avertissements.
function proposerParRegles(texte, { typeChoisi = "", categorieChoisie = "", campusMoi = "" } = {}) {
  const a = analyser(texte, { campusMoi });
  const type = typeChoisi || a.type || "propose";
  const categorie = categorieChoisie || a.categorie || "Autre";
  const mod = modele(categorie, type, a);
  const textes = descriptions(type, a, mod);
  const propositions = mod.titres.slice(0, 3).map((titre, i) => ({
    cle: `p${i + 1}`,
    nom: textes[i % textes.length][0],
    titre: couper(premiereMajuscule(titre.replace(/\s+/g, " ").trim()), LIMITES.titre),
    description: textes[i % textes.length][1],
  }));
  // Toujours au moins trois choix de description, même s'il y a moins de titres.
  while (propositions.length < 3) {
    const i = propositions.length;
    propositions.push({ cle: `p${i + 1}`, nom: textes[i][0], titre: propositions[0].titre, description: textes[i][1] });
  }

  const avertissements = [];
  if (a.argent) avertissements.push("Jamais d'argent sur Coup de Pouce : propose plutôt un échange ou un petit geste (un café, un coup de main en retour).");
  if (!a.reconnu && categorie === "Autre" && !categorieChoisie) avertissements.push("Je n'ai pas reconnu de catégorie : choisis-la toi-même dans la liste. Essaie aussi avec un mot de plus (une matière, un outil…).");

  return {
    fournisseur: "regles",
    comprehension: {
      type,
      typeSur: Boolean(typeChoisi || a.type),
      categorie,
      categorieSure: Boolean(categorieChoisie || a.categorie),
      autreCategorie: categorieChoisie ? "" : a.autreCategorie,
      quand: couper(a.moment, LIMITES.quand),
      contrepartie: couper(a.contrepartie ? premiereMajuscule(a.contrepartie) : "", LIMITES.contrepartie),
    },
    propositions,
    conseils: mod.conseils,
    avertissements,
  };
}

// Pour brancher un modèle plus tard : écrire une fonction avec la même entrée et la même sortie, et la mettre ici.
export const fournisseurRegles = { nom: "regles", proposer: proposerParRegles };
export const proposerRedaction = (texte, options) => fournisseurRegles.proposer(texte, options);
