"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { TYPES, CATEGORIES, sansAccents } from "../annonces";
import { CAMPUS } from "../compte";
import { ALERTES_MAX } from "../alertes";

const texte = (formData, nom) => String(formData.get(nom) ?? "").trim();

// Enregistre les filtres du fil comme alerte, puis revient au fil (mêmes filtres) avec un message.
export async function creerAlerte(formData) {
  const type = TYPES[texte(formData, "type")] ? texte(formData, "type") : null;
  const categorie = CATEGORIES.includes(texte(formData, "categorie")) ? texte(formData, "categorie") : null;
  const campus = CAMPUS.includes(texte(formData, "campus")) ? texte(formData, "campus") : null;
  const mot = sansAccents(texte(formData, "q")).replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40) || null;
  const retour = new URLSearchParams();
  for (const [cle, valeur] of Object.entries({ q: texte(formData, "q"), type, categorie, campus })) if (valeur) retour.set(cle, valeur);
  const suite = (alerte) => {
    retour.set("alerte", alerte);
    redirect(`/annonces?${retour}`);
  };
  if (!type && !categorie && !campus && !mot) suite("vide");
  const supabase = await creerClient();
  const { error } = await supabase.from("alertes").insert({ type, categorie, campus, mot });
  revalidatePath("/notifications");
  if (!error) suite("creee");
  if (error.code === "23505") suite("existe");
  if (error.message?.includes("trop_d_alertes")) suite("limite");
  suite("erreur");
}

export async function supprimerAlerte(id) {
  const supabase = await creerClient();
  await supabase.from("alertes").delete().eq("id", id);
  revalidatePath("/notifications");
}
