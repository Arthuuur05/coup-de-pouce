import { creerClient } from "./supabase/server";
import { badgesGagnes, criteres } from "./badges";

// Chiffres, statut Super Coup de Pouce et conditions d'une personne. null tant que la migration du lot 17 n'est pas appliquée.
export async function chargerBadges(personne) {
  const supabase = await creerClient();
  const { data } = await supabase.rpc("stats_badges", { personne });
  if (!data) return null;
  const stats = { ...data, note: data.note === null ? null : Number(data.note) };
  const gagnes = badgesGagnes(stats);
  return { stats, gagnes, super: gagnes.length > 0, criteres: criteres(stats) };
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
