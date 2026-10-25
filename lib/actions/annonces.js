"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { verifierAnnonce, MAX_EN_LIGNE, DUREE_JOURS } from "../annonces";

const texte = (formData, nom) => String(formData.get(nom) ?? "").trim();

const lireAnnonce = (formData) => ({
  type: texte(formData, "type"),
  categorie: texte(formData, "categorie"),
  titre: texte(formData, "titre"),
  description: texte(formData, "description"),
  contrepartie: texte(formData, "contrepartie"),
  quand: texte(formData, "quand"),
});

function messageBase(error) {
  if (error?.message?.includes("limite_annonces")) {
    return `Tu as déjà ${MAX_EN_LIGNE} annonces en ligne. Marque-en une « C'est réglé » ou supprime-la, puis réessaie.`;
  }
  return "Un problème est survenu. Réessaie dans un instant.";
}

export async function publierAnnonce(_etat, formData) {
  const valeurs = lireAnnonce(formData);
  const erreurs = verifierAnnonce(valeurs);
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  const { data, error } = await supabase.from("annonces").insert(valeurs).select("id").single();
  if (error) return { valeurs, erreurs: {}, message: messageBase(error) };
  revalidatePath("/annonces");
  redirect(`/annonces/${data.id}?publiee=1`);
}

// id est attaché au formulaire avec bind : modifierAnnonce.bind(null, id).
export async function modifierAnnonce(id, _etat, formData) {
  const valeurs = lireAnnonce(formData);
  const erreurs = verifierAnnonce(valeurs);
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  // La base ne laisse modifier que ses propres annonces : 0 ligne si ce n'est pas la mienne.
  const { data, error } = await supabase.from("annonces").update(valeurs).eq("id", id).select("id");
  if (error) return { valeurs, erreurs: {}, message: messageBase(error) };
  if (!data.length) return { valeurs, erreurs: {}, message: "Tu ne peux modifier que tes propres annonces." };
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?modifiee=1`);
}

export async function marquerReglee(id) {
  const supabase = await creerClient();
  await supabase.from("annonces").update({ statut: "reglee" }).eq("id", id);
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?reglee=1`);
}

// Remet en ligne une annonce réglée ou expirée, pour 30 jours.
export async function remettreEnLigne(id) {
  const supabase = await creerClient();
  const expire = new Date(Date.now() + DUREE_JOURS * 86400000).toISOString();
  const { error } = await supabase.from("annonces").update({ statut: "active", expire_le: expire }).eq("id", id);
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?${error?.message?.includes("limite_annonces") ? "limite=1" : "remise=1"}`);
}

export async function supprimerAnnonce(id) {
  const supabase = await creerClient();
  await supabase.from("annonces").delete().eq("id", id);
  revalidatePath("/annonces");
  redirect("/profil?annonce=supprimee#mes-annonces");
}
