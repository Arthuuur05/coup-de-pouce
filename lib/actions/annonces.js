"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { verifierAnnonce, MAX_EN_LIGNE, DUREE_JOURS } from "../annonces";
import { lirePhoto, erreurPhoto, envoyerPhoto, supprimerPhotos } from "../photos";

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

async function idConnecte(supabase) {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/connexion?suite=/publier");
  return id;
}

// Vérifie les champs et la photo.
function verifier(formData) {
  const valeurs = lireAnnonce(formData);
  const photo = lirePhoto(formData);
  const erreurs = verifierAnnonce(valeurs);
  const probleme = photo && erreurPhoto(photo);
  if (probleme) erreurs.photo = probleme;
  return { valeurs, photo, erreurs };
}

export async function publierAnnonce(_etat, formData) {
  const { valeurs, photo, erreurs } = verifier(formData);
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  const moi = await idConnecte(supabase);
  let chemin = "";
  if (photo) {
    chemin = await envoyerPhoto(supabase, moi, photo, "annonce");
    if (!chemin) return { valeurs, erreurs: { photo: "La photo n'a pas pu être envoyée. Réessaie." } };
  }
  const { data, error } = await supabase
    .from("annonces")
    .insert({ ...valeurs, photo: chemin })
    .select("id")
    .single();
  if (error) {
    await supprimerPhotos(supabase, [chemin]);
    return { valeurs, erreurs: {}, message: messageBase(error) };
  }
  revalidatePath("/annonces");
  redirect(`/annonces/${data.id}?publiee=1`);
}

// id est attaché au formulaire avec bind : modifierAnnonce.bind(null, id).
export async function modifierAnnonce(id, _etat, formData) {
  const { valeurs, photo, erreurs } = verifier(formData);
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  const moi = await idConnecte(supabase);
  const { data: avant } = await supabase.from("annonces").select("photo").eq("id", id).eq("auteur", moi).maybeSingle();
  if (!avant) return { valeurs, erreurs: {}, message: "Tu ne peux modifier que tes propres annonces." };

  const changements = { ...valeurs };
  if (photo) {
    const chemin = await envoyerPhoto(supabase, moi, photo, "annonce");
    if (!chemin) return { valeurs, erreurs: { photo: "La photo n'a pas pu être envoyée. Réessaie." } };
    changements.photo = chemin;
  } else if (formData.get("retirerPhoto")) {
    changements.photo = "";
  }
  // La base ne laisse modifier que ses propres annonces : 0 ligne si ce n'est pas la mienne.
  const { data, error } = await supabase.from("annonces").update(changements).eq("id", id).select("id");
  if (error || !data.length) {
    await supprimerPhotos(supabase, [photo && changements.photo]);
    return { valeurs, erreurs: {}, message: error ? messageBase(error) : "Tu ne peux modifier que tes propres annonces." };
  }
  if ("photo" in changements && avant.photo) await supprimerPhotos(supabase, [avant.photo]);
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?modifiee=1`);
}

export async function marquerReglee(id) {
  const supabase = await creerClient();
  await supabase.from("annonces").update({ statut: "reglee" }).eq("id", id);
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?reglee=1`);
}

// Remet en ligne (ou prolonge) une annonce pour 30 jours. suite : la page où revenir.
export async function remettreEnLigne(id, suite) {
  const supabase = await creerClient();
  const expire = new Date(Date.now() + DUREE_JOURS * 86400000).toISOString();
  const { error } = await supabase.from("annonces").update({ statut: "active", expire_le: expire }).eq("id", id);
  revalidatePath("/annonces");
  revalidatePath("/profil");
  const limite = error?.message?.includes("limite_annonces");
  if (suite === "profil") redirect(`/profil?annonce=${limite ? "limite" : "prolongee"}#mes-annonces`);
  redirect(`/annonces/${id}?${limite ? "limite=1" : "remise=1"}`);
}

export async function supprimerAnnonce(id) {
  const supabase = await creerClient();
  const { data } = await supabase.from("annonces").delete().eq("id", id).select("photo");
  await supprimerPhotos(supabase, (data ?? []).map((a) => a.photo));
  revalidatePath("/annonces");
  redirect("/profil?annonce=supprimee#mes-annonces");
}

// Ajoute ou retire une annonce de mes favoris. Personne d'autre ne le voit.
export async function basculerFavori(id, dejaFavori) {
  const supabase = await creerClient();
  if (dejaFavori) await supabase.from("favoris").delete().eq("annonce", id);
  else await supabase.from("favoris").insert({ annonce: id });
  revalidatePath("/", "layout");
}
