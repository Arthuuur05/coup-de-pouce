// Le statut « Super Coup de Pouce », dans l'esprit du Superhost d'Airbnb : un seul badge, qui se mérite et se garde.
// Il se calcule à partir de chiffres (stats_badges) : il n'est jamais « donné » à la main.
export const COUPS_REQUIS = 5;
export const NOTE_REQUISE = 4.5;
export const AVIS_REQUIS = 3;

// Les trois conditions, avec l'avancement de chacune (pour dire « il te manque… »).
export function criteres(s) {
  const note = s.note === null || s.note === undefined ? null : Number(s.note);
  return [
    {
      cle: "coups",
      texte: `${COUPS_REQUIS} coups de pouce rendus`,
      actuel: `${Math.min(s.coups, COUPS_REQUIS)}/${COUPS_REQUIS}`,
      ok: s.coups >= COUPS_REQUIS,
      avancement: Math.min(100, Math.round((s.coups / COUPS_REQUIS) * 100)),
    },
    {
      cle: "avis",
      texte: `Note moyenne d'au moins ${String(NOTE_REQUISE).replace(".", ",")} sur ${AVIS_REQUIS} avis`,
      actuel: s.avis ? `${String(note ?? "—").replace(".", ",")} sur ${s.avis} avis` : "Pas encore d'avis",
      ok: s.avis >= AVIS_REQUIS && note !== null && note >= NOTE_REQUISE,
      avancement: s.avis >= AVIS_REQUIS ? (note !== null ? Math.min(100, Math.round((note / NOTE_REQUISE) * 100)) : 0) : Math.round((s.avis / AVIS_REQUIS) * 70),
    },
    {
      cle: "profil",
      texte: "Profil complet : photo, filière, campus et une compétence",
      actuel: s.profil_complet ? "Complet" : "À compléter",
      ok: Boolean(s.profil_complet),
      avancement: s.profil_complet ? 100 : 0,
    },
  ];
}

export const BADGES = [
  {
    cle: "super-coup-de-pouce",
    emoji: "🏅",
    titre: "Super Coup de Pouce",
    texte: "Une personne fiable et généreuse, reconnue par le campus.",
    ok: (s) => criteres(s).every((c) => c.ok),
  },
];

export function badgesGagnes(s) {
  return BADGES.filter((b) => b.ok(s));
}
