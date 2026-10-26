import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";

// Le classement du mois (0 = ce mois-ci, 1 = le mois dernier). null tant que la migration du lot 18 n'est pas appliquée.
export async function chargerClassement(decalage, campus) {
  const supabase = await creerClient();
  const { data, error } = await supabase.rpc("classement_mensuel", { decalage, filtre_campus: campus || null });
  if (error || !data) return null;
  const photos = await profilsVisibles(data.slice(0, 10).map((l) => l.personne));
  return data.map((l) => ({ ...l, photoUrl: photos[l.personne]?.photoUrl ?? null }));
}

// Est-ce que j'apparais dans le classement ? null si la colonne n'existe pas encore.
export async function chargerReglageClassement(id) {
  const supabase = await creerClient();
  const { data, error } = await supabase.from("profils").select("classement").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data.classement;
}
