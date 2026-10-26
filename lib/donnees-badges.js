import { creerClient } from "./supabase/server";
import { BADGES, badgesGagnes, niveauDe } from "./badges";

// Chiffres, badges et niveau d'une personne. null tant que la migration du lot 17 n'est pas appliquée.
export async function chargerBadges(personne) {
  const supabase = await creerClient();
  const { data } = await supabase.rpc("stats_badges", { personne });
  if (!data) return null;
  const stats = { ...data, note: data.note === null ? null : Number(data.note) };
  const gagnes = badgesGagnes(stats);
  return { stats, gagnes, niveau: niveauDe(stats), restants: BADGES.filter((b) => !gagnes.includes(b)) };
}

// Parmi mes badges gagnés, ceux que je n'ai pas encore fêtés.
export async function chargerBadgesAFeter(gagnes) {
  if (!gagnes.length) return [];
  const supabase = await creerClient();
  const { data, error } = await supabase.from("badges_vus").select("badge");
  if (error) return [];
  const vus = new Set((data ?? []).map((v) => v.badge));
  return gagnes.filter((b) => !vus.has(b.cle));
}
