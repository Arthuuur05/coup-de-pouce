"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import {
  MAX_COMPETENCES,
  COMMENTAIRE_MAX,
  CV_POIDS_MAX,
  nettoyerNom,
  erreurNomCompetence,
} from "../competences";

const rafraichir = () => revalidatePath("/", "layout");
const PROBLEME = "Un problème est survenu. Réessaie dans un instant.";

async function idConnecte(supabase, suite) {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect(`/connexion?suite=${suite}`);
  return id;
}

export async function ajouterCompetence(_etat, formData) {
  const nom = nettoyerNom(formData.get("nom"));
  const erreur = erreurNomCompetence(nom);
  if (erreur) return { nom, erreur };
  const supabase = await creerClient();
  await idConnecte(supabase, "/profil");
  const { error } = await supabase.from("competences").insert({ nom });
  if (error) {
    if (error.code === "23505") return { nom, erreur: "Tu as déjà cette compétence." };
    if (error.message?.includes("trop_de_competences"))
      return { nom, erreur: `${MAX_COMPETENCES} compétences au maximum : supprime-en une d'abord.` };
    return { nom, erreur: PROBLEME };
  }
  rafraichir();
  return { nom: "", ok: true, tentative: Date.now() };
}

export async function supprimerCompetence(id) {
  const supabase = await creerClient();
  await idConnecte(supabase, "/profil");
  await supabase.from("competences").delete().eq("id", id);
  rafraichir();
  redirect("/profil#mes-competences");
}

// CV : un PDF de 5 Mo au plus, qui remplace le précédent.
export async function envoyerCv(_etat, formData) {
  const fichier = formData.get("cv");
  const tentative = Date.now();
  if (!fichier || typeof fichier !== "object" || fichier.size === 0) return { erreur: "Choisis un fichier PDF d'abord.", tentative };
  if (fichier.type !== "application/pdf") return { erreur: "Seul le format PDF est accepté.", tentative };
  if (fichier.size > CV_POIDS_MAX) return { erreur: "5 Mo maximum.", tentative };

  const supabase = await creerClient();
  const id = await idConnecte(supabase, "/profil");
  const { data: avant } = await supabase.from("cvs").select("chemin").eq("personne", id).maybeSingle();
  const chemin = `${id}/cv-${Date.now()}.pdf`;
  const { error: erreurEnvoi } = await supabase.storage.from("cv").upload(chemin, fichier, { contentType: "application/pdf" });
  if (erreurEnvoi) return { erreur: "Le CV n'a pas pu être envoyé. Réessaie.", tentative };

  const nomFichier = String(fichier.name || "cv.pdf").slice(0, 120);
  const valeurs = { chemin, nom_fichier: nomFichier, modifie_le: new Date().toISOString() };
  const { data: maj, error } = await supabase.from("cvs").update(valeurs).eq("personne", id).select("personne");
  let erreurBase = error;
  if (!erreurBase && !maj.length) ({ error: erreurBase } = await supabase.from("cvs").insert({ personne: id, ...valeurs }));
  if (erreurBase) {
    await supabase.storage.from("cv").remove([chemin]);
    return { erreur: PROBLEME, tentative };
  }
  if (avant?.chemin) await supabase.storage.from("cv").remove([avant.chemin]);
  rafraichir();
  return { ok: "Ton CV est enregistré.", tentative };
}

export async function supprimerCv() {
  const supabase = await creerClient();
  const id = await idConnecte(supabase, "/profil");
  const { data } = await supabase.from("cvs").select("chemin").eq("personne", id).maybeSingle();
  await supabase.from("cvs").delete().eq("personne", id);
  if (data?.chemin) await supabase.storage.from("cv").remove([data.chemin]);
  rafraichir();
  redirect("/profil#mon-cv");
}

// Donner son avis sur l'autre personne d'une demande acceptée. demandeId est attaché avec bind.
export async function donnerAvis(demandeId, _etat, formData) {
  const note = Number(formData.get("note"));
  const commentaire = String(formData.get("commentaire") ?? "").trim();
  const competence = String(formData.get("competence") ?? "") || null;
  const valeurs = { note: note || 0, commentaire, competence: competence ?? "" };
  if (!Number.isInteger(note) || note < 1 || note > 5) return { valeurs, erreur: "Choisis une note de 1 à 5." };
  if (commentaire.length > COMMENTAIRE_MAX) return { valeurs, erreur: `${COMMENTAIRE_MAX} caractères maximum.` };

  const supabase = await creerClient();
  await idConnecte(supabase, "/demandes");
  const { error } = await supabase.from("avis").insert({ demande: demandeId, note, commentaire, competence });
  if (error) {
    if (error.code === "23505") return { valeurs, erreur: "Tu as déjà donné ton avis." };
    if (error.message?.includes("avis_impossible")) return { valeurs, erreur: "Tu ne peux pas donner d'avis sur cette demande." };
    if (error.message?.includes("competence_inconnue")) return { valeurs, erreur: "Cette compétence n'existe plus." };
    return { valeurs, erreur: PROBLEME };
  }
  rafraichir();
  return { valeurs, ok: "Merci ! Ton avis est publié sur son profil." };
}

export async function supprimerAvis(id, suite) {
  const supabase = await creerClient();
  await idConnecte(supabase, "/demandes");
  await supabase.from("avis").delete().eq("id", id);
  rafraichir();
  redirect(suite);
}
