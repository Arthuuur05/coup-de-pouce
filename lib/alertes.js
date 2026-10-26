import { TYPES } from "./annonces";

export const ALERTES_MAX = 5;

// « Je propose · Photo · campus Lyon · « montage » » : ce que l'alerte surveille.
export const libelleAlerte = (a) =>
  [a.type && TYPES[a.type], a.categorie, a.campus && `campus ${a.campus}`, a.mot && `« ${a.mot} »`].filter(Boolean).join(" · ");
