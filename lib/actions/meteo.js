"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { TITRE_MAX, TEXTE_MAX, lundiDeLaSemaine, bulletinModele } from "../meteo";

const PROBLEME = "Un problème est survenu. Réessaie dans un instant.";
const rafraichir = () => {
  revalidatePath("/meteo");
  revalidatePath("/admin/meteo");
};

// Seule l'admin entre ici (la base refuse de toute façon les autres).
async function admin() {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/connexion?suite=/admin/meteo");
  const { data: estAdmin } = await supabase.rpc("est_admin");
  if (!estAdmin) redirect("/meteo");
  return supabase;
}

// Calcule les besoins de la semaine et crée le brouillon, ou le recalcule s'il est encore en brouillon.
export async function genererBulletin() {
  const supabase = await admin();
  const semaine = lundiDeLaSemaine();
  const { data: besoinsBruts, error } = await supabase.rpc("besoins_semaine");
  if (error) redirect("/admin/meteo?erreur=1");
  const besoins = (besoinsBruts ?? []).map((b) => ({ categorie: b.categorie, nombre: Number(b.nombre) }));
  const modele = bulletinModele(besoins);

  const { data: existant } = await supabase.from("bulletins").select("id, statut").eq("semaine", semaine).maybeSingle();
  let erreur;
  if (!existant) ({ error: erreur } = await supabase.from("bulletins").insert({ semaine, besoins, ...modele }));
  else if (existant.statut === "brouillon")
    ({ error: erreur } = await supabase.from("bulletins").update({ besoins, ...modele }).eq("id", existant.id));
  else redirect("/admin/meteo?erreur=publie");
  rafraichir();
  redirect(erreur ? "/admin/meteo?erreur=1" : "/admin/meteo?ok=genere");
}

// Enregistrer le texte, ou le publier (intent), ou le repasser en brouillon.
export async function enregistrerBulletin(id, _etat, formData) {
  const titre = String(formData.get("titre") ?? "").trim();
  const texte = String(formData.get("texte") ?? "").trim();
  const intent = String(formData.get("intent") ?? "enregistrer");
  const valeurs = { titre, texte };
  if (!titre) return { valeurs, erreurs: { titre: "Donne un titre au bulletin." } };
  if (titre.length > TITRE_MAX) return { valeurs, erreurs: { titre: `${TITRE_MAX} caractères maximum.` } };
  if (!texte) return { valeurs, erreurs: { texte: "Écris le texte du bulletin." } };
  if (texte.length > TEXTE_MAX) return { valeurs, erreurs: { texte: `${TEXTE_MAX} caractères maximum.` } };

  const supabase = await admin();
  const statut = intent === "publier" ? "publie" : intent === "depublier" ? "brouillon" : undefined;
  const { error } = await supabase.from("bulletins").update({ titre, texte, ...(statut && { statut }) }).eq("id", id);
  if (error) return { valeurs, message: PROBLEME };
  rafraichir();
  const ok = intent === "publier" ? "Bulletin publié : tout le campus le voit." : intent === "depublier" ? "Bulletin repassé en brouillon." : "Modifications enregistrées.";
  return { valeurs, ok };
}

