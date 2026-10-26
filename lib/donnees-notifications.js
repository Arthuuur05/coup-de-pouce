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
  const { data } = await supabase
    .from("notifications")
    .select("id, type, acteur, demande, annonce, titre, cree_le, lue_le")
    .order("cree_le", { ascending: false })
    .limit(50);
  const liste = data ?? [];
  const profils = await profilsVisibles([...new Set(liste.map((n) => n.acteur))]);
  return liste.map((n) => ({ ...n, acteurProfil: profils[n.acteur] }));
}
