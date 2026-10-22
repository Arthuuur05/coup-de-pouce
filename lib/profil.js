import { creerClient } from "./supabase/server";

// Le profil de la personne connectée (ou null). La règle de la base ne renvoie que le sien.
export async function profilConnecte() {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profil } = await supabase
    .from("profils")
    .select("prenom, nom, filiere, annee, campus, est_admin")
    .eq("id", id)
    .maybeSingle();
  return profil ? { ...profil, email: data.claims.email } : null;
}
