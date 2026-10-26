import { creerClient } from "./supabase/server";

const CHAMPS = "id, semaine, titre, texte, besoins, statut, publie_le, modifie_le";

// Le dernier bulletin publié, ou null.
export async function chargerBulletinPublie() {
  const supabase = await creerClient();
  const { data } = await supabase
    .from("bulletins")
    .select(CHAMPS)
    .eq("statut", "publie")
    .order("semaine", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Le bulletin d'une semaine (brouillon ou publié, la base ne le montre qu'à l'admin), ou null.
export async function chargerBulletinSemaine(semaine) {
  const supabase = await creerClient();
  const { data } = await supabase.from("bulletins").select(CHAMPS).eq("semaine", semaine).maybeSingle();
  return data;
}
