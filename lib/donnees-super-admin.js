import { creerClient } from "./supabase/server";

// Tableau de bord (la base refuse tout autre que le super admin).
export async function chargerTableauDeBord() {
  const supabase = await creerClient();
  const { data, error } = await supabase.rpc("tableau_de_bord");
  return { tableau: error ? null : data, erreur: Boolean(error) };
}

// Les dernières lignes du journal, éventuellement d'un seul niveau.
export async function chargerJournal(niveau) {
  const supabase = await creerClient();
  let requete = supabase.from("journal").select("id, niveau, source, message, chemin, cree_le").order("cree_le", { ascending: false }).limit(50);
  if (niveau) requete = requete.eq("niveau", niveau);
  const { data } = await requete;
  return data ?? [];
}
