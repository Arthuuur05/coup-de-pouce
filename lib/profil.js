import { cache } from "react";
import { creerClient } from "./supabase/server";

// Le profil de la personne connectée (ou null). La règle de la base ne renvoie que le sien.
// cache : lu une seule fois par affichage de page, même si le menu et la page le demandent tous les deux.
export const profilConnecte = cache(async () => {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profil } = await supabase
    .from("profils")
    .select("prenom, nom, filiere, annee, campus, photo, est_admin")
    .eq("id", id)
    .maybeSingle();
  return profil ? { ...profil, id, email: data.claims.email } : null;
});
