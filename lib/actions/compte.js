"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { creerClient } from "../supabase/server";
import { ANNEES, MOT_DE_PASSE_MIN } from "../compte";

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
  if (Object.keys(erreurs).length) return { valeurs, erreurs };

  const origine = (await headers()).get("origin");
  const supabase = await creerClient();
  const { data, error } = await supabase.auth.signUp({
    email: valeurs.email,
    password: motDePasse,
    options: {
      emailRedirectTo: `${origine}/auth/confirm?suite=/annonces`,
      data: { prenom: valeurs.prenom, nom: valeurs.nom, filiere: valeurs.filiere, annee: valeurs.annee },
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
  if (valeurs.campus.length > 60) erreurs.campus = "60 caractères maximum.";
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
