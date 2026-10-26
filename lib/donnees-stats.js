import { creerClient } from "./supabase/server";

// Les statistiques de l'admin (la base refuse tout autre que l'admin).
export async function chargerStats() {
  const supabase = await creerClient();
  const { data, error } = await supabase.rpc("stats_admin");
  return { stats: error ? null : data, erreur: Boolean(error) };
}
