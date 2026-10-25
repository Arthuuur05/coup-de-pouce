"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { creerClient } from "../supabase/server";
import { ANNEES, CAMPUS, MOT_DE_PASSE_MIN, MOT_DE_CONFIRMATION } from "../compte";

const texte = (formData, nom) => String(formData.get(nom) ?? "").trim();
const emailValide = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// N'accepte qu'un chemin interne (« /annonces »), jamais une autre adresse.
const cheminSur = (suite) => (suite.startsWith("/") && !suite.startsWith("//") ? suite : "/annonces");

function messageSupabase(error) {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Ton e-mail n'est pas encore confirmé : clique sur le lien reçu par e-mail.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
    case "weak_password":
      return `Mot de passe trop faible : au moins ${MOT_DE_PASSE_MIN} caractères.`;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives d'un coup. Réessaie dans quelques minutes.";
    case "email_address_invalid":
      return "Cette adresse e-mail n'est pas acceptée.";
    case "same_password":
      return "C'est déjà ton mot de passe actuel.";
    case "otp_expired":
      return "Ce lien a expiré. Demande-en un nouveau.";
    case "email_address_not_authorized":
      return "On ne peut pas encore envoyer d'e-mail à cette adresse. Réessaie plus tard.";
    default:
      return "Un problème est survenu. Réessaie dans un instant.";
  }
}

export async function inscrire(_etat, formData) {
  const valeurs = {
    prenom: texte(formData, "prenom"),
    nom: texte(formData, "nom"),
    email: texte(formData, "email").toLowerCase(),
    filiere: texte(formData, "filiere"),
    annee: texte(formData, "annee"),
    campus: texte(formData, "campus"),
  };
  const motDePasse = String(formData.get("motDePasse") ?? "");

  const erreurs = {};
  if (!valeurs.prenom) erreurs.prenom = "Indique ton prénom.";
  else if (valeurs.prenom.length > 40) erreurs.prenom = "40 caractères maximum.";
  if (!valeurs.nom) erreurs.nom = "Indique ton nom.";
  else if (valeurs.nom.length > 60) erreurs.nom = "60 caractères maximum.";
  if (!emailValide(valeurs.email)) erreurs.email = "Cet e-mail n'est pas valide (exemple : prenom@ecole.fr).";
  if (motDePasse.length < MOT_DE_PASSE_MIN) erreurs.motDePasse = `Au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (valeurs.filiere.length > 60) erreurs.filiere = "60 caractères maximum.";
  if (!ANNEES.includes(valeurs.annee)) erreurs.annee = "Choisis ton année.";
  if (!CAMPUS.includes(valeurs.campus)) erreurs.campus = "Choisis ton campus.";
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const origine = (await headers()).get("origin");
  const supabase = await creerClient();
  const { data, error } = await supabase.auth.signUp({
    email: valeurs.email,
    password: motDePasse,
    options: {
      emailRedirectTo: `${origine}/auth/confirm?suite=/annonces`,
      data: { prenom: valeurs.prenom, nom: valeurs.nom, filiere: valeurs.filiere, annee: valeurs.annee, campus: valeurs.campus },
    },
  });

  if (error) return { valeurs, erreurs: {}, message: messageSupabase(error) };
  // Supabase ne dit pas qu'un e-mail est déjà pris quand la confirmation est activée : compte sans identité = déjà existant.
  if (data.user && data.user.identities?.length === 0) {
    return { valeurs, erreurs: {}, message: messageSupabase({ code: "user_already_exists" }) };
  }
  if (data.session) redirect("/annonces");
  return { envoye: true, email: valeurs.email };
}

export async function connecter(_etat, formData) {
  const email = texte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const suite = cheminSur(texte(formData, "suite"));

  const erreurs = {};
  if (!emailValide(email)) erreurs.email = "Cet e-mail n'est pas valide (exemple : prenom@ecole.fr).";
  if (!motDePasse) erreurs.motDePasse = "Indique ton mot de passe.";
  if (Object.keys(erreurs).length) return { email, erreurs };

  const supabase = await creerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { email, erreurs: {}, message: messageSupabase(error) };
  redirect(suite);
}

export async function deconnecter() {
  const supabase = await creerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function modifierProfil(_etat, formData) {
  const valeurs = {
    prenom: texte(formData, "prenom"),
    nom: texte(formData, "nom"),
    filiere: texte(formData, "filiere"),
    annee: texte(formData, "annee"),
    campus: texte(formData, "campus"),
  };

  const erreurs = {};
  if (!valeurs.prenom) erreurs.prenom = "Indique ton prénom.";
  else if (valeurs.prenom.length > 40) erreurs.prenom = "40 caractères maximum.";
  if (!valeurs.nom) erreurs.nom = "Indique ton nom.";
  else if (valeurs.nom.length > 60) erreurs.nom = "60 caractères maximum.";
  if (valeurs.filiere.length > 60) erreurs.filiere = "60 caractères maximum.";
  if (!ANNEES.includes(valeurs.annee)) erreurs.annee = "Choisis ton année.";
  if (!CAMPUS.includes(valeurs.campus)) erreurs.campus = "Choisis ton campus.";
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/connexion?suite=/profil");

  // La base vérifie aussi que c'est bien ton profil (règle « Modifier son profil »).
  const { error } = await supabase.from("profils").update(valeurs).eq("id", id);
  if (error) return { valeurs, erreurs: {}, message: "L'enregistrement a échoué. Réessaie." };
  return { valeurs, erreurs: {}, ok: "Profil enregistré." };
}

// Identifiant de la personne connectée, sinon retour à la connexion.
async function idConnecte(supabase, suite) {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect(`/connexion?suite=${suite}`);
  return { id, email: data.claims.email };
}

export async function demanderNouveauMotDePasse(_etat, formData) {
  const email = texte(formData, "email").toLowerCase();
  if (!emailValide(email)) return { email, erreurs: { email: "Cet e-mail n'est pas valide (exemple : prenom@ecole.fr)." } };

  const origine = (await headers()).get("origin");
  const supabase = await creerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origine}/auth/confirm?suite=/nouveau-mot-de-passe`,
  });
  // On ne dit jamais si un compte existe ou non pour cet e-mail.
  if (error && error.code !== "user_not_found") return { email, erreurs: {}, message: messageSupabase(error) };
  return { envoye: true, email };
}

function verifierNouveauMotDePasse(motDePasse, confirmation) {
  const erreurs = {};
  if (motDePasse.length < MOT_DE_PASSE_MIN) erreurs.motDePasse = `Au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (confirmation !== motDePasse) erreurs.confirmation = "Les deux mots de passe ne sont pas identiques.";
  return erreurs;
}

// Après le lien « mot de passe oublié » : la session est ouverte, on choisit le nouveau mot de passe.
export async function definirNouveauMotDePasse(_etat, formData) {
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const erreurs = verifierNouveauMotDePasse(motDePasse, String(formData.get("confirmation") ?? ""));
  if (Object.keys(erreurs).length) return { erreurs };

  const supabase = await creerClient();
  await idConnecte(supabase, "/nouveau-mot-de-passe");
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { erreurs: {}, message: messageSupabase(error) };
  redirect("/annonces");
}

// Depuis le profil : on redemande le mot de passe actuel avant de le changer.
export async function changerMotDePasse(_etat, formData) {
  const actuel = String(formData.get("actuel") ?? "");
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const erreurs = verifierNouveauMotDePasse(motDePasse, String(formData.get("confirmation") ?? ""));
  if (!actuel) erreurs.actuel = "Indique ton mot de passe actuel.";
  if (Object.keys(erreurs).length) return { erreurs };

  const supabase = await creerClient();
  const { email } = await idConnecte(supabase, "/profil");
  const verification = await supabase.auth.signInWithPassword({ email, password: actuel });
  if (verification.error) return { erreurs: { actuel: "Mot de passe actuel incorrect." } };

  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { erreurs: {}, message: messageSupabase(error) };
  return { erreurs: {}, ok: "Mot de passe changé." };
}

export async function changerEmail(_etat, formData) {
  const email = texte(formData, "email").toLowerCase();
  if (!emailValide(email)) return { email, erreurs: { email: "Cet e-mail n'est pas valide (exemple : prenom@ecole.fr)." } };

  const supabase = await creerClient();
  const actuel = await idConnecte(supabase, "/profil");
  if (email === actuel.email) return { email, erreurs: { email: "C'est déjà ton adresse actuelle." } };

  const origine = (await headers()).get("origin");
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${origine}/auth/confirm?suite=/profil` });
  if (error) return { email, erreurs: {}, message: messageSupabase(error) };
  return {
    email,
    erreurs: {},
    ok: "C'est presque fait : clique sur le lien reçu sur ton ancienne et ta nouvelle adresse pour confirmer.",
  };
}

export async function supprimerCompte(_etat, formData) {
  if (texte(formData, "confirmation") !== MOT_DE_CONFIRMATION) {
    return { erreurs: { confirmation: `Tape ${MOT_DE_CONFIRMATION} en majuscules pour confirmer.` } };
  }
  const supabase = await creerClient();
  await idConnecte(supabase, "/profil");
  // La fonction de la base n'efface que le compte de la personne connectée.
  const { error } = await supabase.rpc("supprimer_mon_compte");
  if (error) return { erreurs: {}, message: "La suppression a échoué. Réessaie." };
  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
