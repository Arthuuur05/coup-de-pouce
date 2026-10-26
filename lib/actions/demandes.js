"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { MESSAGE_MAX, MAX_EN_ATTENTE, verifierCoordonnees, nettoyerInstagram } from "../demandes";

const texte = (formData, nom) => String(formData.get(nom) ?? "").trim();

function messageBase(error) {
  const m = error?.message ?? "";
  if (error?.code === "23505") return "Tu as déjà fait une demande pour cette annonce.";
  if (m.includes("propre_annonce")) return "C'est ton annonce : tu ne peux pas te demander le contact.";
  if (m.includes("annonce_indisponible")) return "Cette annonce n'est plus en ligne.";
  if (m.includes("trop_de_demandes"))
    return `Tu as déjà ${MAX_EN_ATTENTE} demandes en attente. Attends quelques réponses (ou annule-en une) avant d'en envoyer une autre.`;
  if (m.includes("statut_impossible")) return "Cette demande a déjà reçu une réponse.";
  return "Un problème est survenu. Réessaie dans un instant.";
}

const rafraichir = () => revalidatePath("/", "layout");

// Demander le contact, avec un message facultatif. annonceId est attaché avec bind.
export async function demanderContact(annonceId, _etat, formData) {
  const message = texte(formData, "message");
  if (message.length > MESSAGE_MAX) return { message, erreur: `${MESSAGE_MAX} caractères maximum.` };
  const supabase = await creerClient();
  const { error } = await supabase.from("demandes").insert({ annonce: annonceId, message });
  if (error) return { message, erreur: messageBase(error) };
  rafraichir();
  redirect(`/annonces/${annonceId}?demande=envoyee`);
}

// Annuler ma demande tant qu'elle est en attente (la base refuse sinon).
export async function annulerDemande(id, suite) {
  const supabase = await creerClient();
  await supabase.from("demandes").delete().eq("id", id).eq("statut", "en_attente");
  rafraichir();
  redirect(suite);
}

// Accepter, refuser ou retirer mon accord. L'auteur fait les trois ; le demandeur peut seulement retirer
// l'accord (envoyee = true). La base vérifie qui a le droit de faire quoi.
export async function repondreDemande(id, statut, envoyee = false) {
  const supabase = await creerClient();
  const { error } = await supabase.from("demandes").update({ statut }).eq("id", id);
  rafraichir();
  const onglet = envoyee ? "onglet=envoyees&" : "";
  redirect(`/demandes?${onglet}${error ? "erreur=1" : `reponse=${statut}`}#demande-${id}`);
}

export async function enregistrerCoordonnees(_etat, formData) {
  const valeurs = {
    email: texte(formData, "email").toLowerCase(),
    telephone: texte(formData, "telephone"),
    instagram: nettoyerInstagram(formData.get("instagram")),
  };
  const erreurs = verifierCoordonnees(valeurs);
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  const moi = data?.claims?.sub;
  if (!moi) redirect("/connexion?suite=/profil");
  // Mise à jour, ou création la première fois.
  const { data: maj, error: erreurMaj } = await supabase
    .from("coordonnees")
    .update({ ...valeurs, modifie_le: new Date().toISOString() })
    .eq("personne", moi)
    .select("personne");
  let error = erreurMaj;
  if (!error && !maj.length) ({ error } = await supabase.from("coordonnees").insert({ personne: moi, ...valeurs }));
  if (error) return { valeurs, erreurs: {}, message: "Un problème est survenu. Réessaie dans un instant." };
  rafraichir();
  return { valeurs, erreurs: {}, ok: "Tes coordonnées sont enregistrées." };
}
