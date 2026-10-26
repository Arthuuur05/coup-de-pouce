import { creerClient } from "./supabase/server";

// Mes alertes (la base ne renvoie que les miennes).
export async function chargerMesAlertes() {
  const supabase = await creerClient();
  const { data } = await supabase.from("alertes").select("id, type, categorie, campus, mot").order("cree_le", { ascending: false });
  return data ?? [];
}
