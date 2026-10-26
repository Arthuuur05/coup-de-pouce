// Badges et niveaux. Tout se calcule à partir de chiffres (stats_badges) : un badge n'est jamais « donné » à la main.
export const BADGES = [
  { cle: "premier-coup", emoji: "🤝", titre: "Premier coup de pouce", texte: "Un premier coup de main rendu.", ok: (s) => s.coups >= 1 },
  { cle: "coups-5", emoji: "💪", titre: "5 aides rendues", texte: "Cinq coups de main rendus.", ok: (s) => s.coups >= 5 },
  { cle: "coups-10", emoji: "🔟", titre: "10 aides rendues", texte: "Dix coups de main rendus.", ok: (s) => s.coups >= 10 },
  { cle: "coups-25", emoji: "🏅", titre: "25 aides rendues", texte: "Vingt-cinq coups de main rendus.", ok: (s) => s.coups >= 25 },
  { cle: "premiere-annonce", emoji: "📌", titre: "Première annonce", texte: "Une première annonce publiée.", ok: (s) => s.annonces >= 1 },
  { cle: "profil-complet", emoji: "✨", titre: "Profil complet", texte: "Photo, filière, campus et une compétence.", ok: (s) => s.profil_complet },
  { cle: "premier-avis", emoji: "💬", titre: "Premier avis", texte: "Un premier avis reçu.", ok: (s) => s.avis >= 1 },
  { cle: "avis-5", emoji: "🌟", titre: "5 avis reçus", texte: "Cinq avis reçus.", ok: (s) => s.avis >= 5 },
  { cle: "cinq-etoiles", emoji: "⭐", titre: "Étoile du campus", texte: "Une note moyenne d'au moins 4,5 sur 3 avis ou plus.", ok: (s) => s.avis >= 3 && Number(s.note) >= 4.5 },
];

export const NIVEAUX = [
  { nom: "Petite graine", min: 0 },
  { nom: "Coup de main", min: 10 },
  { nom: "Bras droit", min: 30 },
  { nom: "Pilier du campus", min: 70 },
  { nom: "Légende du campus", min: 150 },
];

// Les points : un coup de pouce rendu pèse le plus, puis les avis, les annonces et un profil soigné.
export function points(s) {
  return s.coups * 10 + s.avis * 3 + s.annonces * 2 + (s.profil_complet ? 5 : 0);
}

export function niveauDe(s) {
  const p = points(s);
  let index = 0;
  NIVEAUX.forEach((n, i) => {
    if (p >= n.min) index = i;
  });
  const suivant = NIVEAUX[index + 1] ?? null;
  const debut = NIVEAUX[index].min;
  return {
    index: index + 1,
    nom: NIVEAUX[index].nom,
    points: p,
    suivant: suivant?.nom ?? null,
    manque: suivant ? suivant.min - p : 0,
    avancement: suivant ? Math.round(((p - debut) / (suivant.min - debut)) * 100) : 100,
  };
}

export function badgesGagnes(s) {
  return BADGES.filter((b) => b.ok(s));
}
