import { cache } from "react";
import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";

// Nombre de notifications non lues (pastille de la cloche). cache : une seule lecture par page.
export const compterNonLues = cache(async () => {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("lue_le", null);
  return count ?? 0;
});

// Mes 50 dernières notifications, avec la personne concernée. La base ne renvoie que les miennes.
export async function chargerMesNotifications() {
  const supabase = await creerClient();
  const lire = (colonnes) =>
    supabase.from("notifications").select(colonnes).order("cree_le", { ascending: false }).limit(50);
  let { data, error } = await lire("id, type, acteur, demande, annonce, titre, cree_le, lue_le");
  // Avant la migration du lot 13, la colonne « annonce » n'existe pas encore : on relit sans elle.
  if (error) ({ data } = await lire("id, type, acteur, demande, titre, cree_le, lue_le"));
  const liste = data ?? [];
  const profils = await profilsVisibles([...new Set(liste.map((n) => n.acteur))]);
  return liste.map((n) => ({ ...n, acteurProfil: profils[n.acteur] }));
}
