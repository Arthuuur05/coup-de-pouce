import { cache } from "react";
import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";

// Mes coordonnées privées (ou des champs vides).
export async function chargerMesCoordonnees(moiId) {
  const supabase = await creerClient();
  const { data } = await supabase
    .from("coordonnees")
    .select("email, telephone, instagram")
    .eq("personne", moiId)
    .maybeSingle();
  return data ?? { email: "", telephone: "", instagram: "" };
}

// Mes demandes reçues et envoyées, avec l'autre personne et, après accord seulement, ses coordonnées.
// La base ne renvoie les coordonnées de l'autre que si la demande est acceptée.
export async function chargerMesDemandes() {
  const supabase = await creerClient();
  const { data: demandes } = await supabase.rpc("mes_demandes");
  const liste = demandes ?? [];
  const autres = [...new Set(liste.map((d) => d.autre))];
  const acceptes = [...new Set(liste.filter((d) => d.statut === "acceptee").map((d) => d.autre))];
  const [profils, { data: coordonnees }] = await Promise.all([
    profilsVisibles(autres),
    acceptes.length
      ? supabase.from("coordonnees").select("personne, email, telephone, instagram").in("personne", acceptes)
      : Promise.resolve({ data: [] }),
  ]);
  const coordonneesDe = Object.fromEntries((coordonnees ?? []).map((c) => [c.personne, c]));
  return liste.map((d) => ({
    ...d,
    autreProfil: profils[d.autre],
    coordonnees: d.statut === "acceptee" ? coordonneesDe[d.autre] ?? null : null,
  }));
}

// Nombre de demandes reçues en attente (pastille du menu). cache : une seule lecture par page.
export const compterEnAttente = cache(async () => {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  const moi = data?.claims?.sub;
  if (!moi) return 0;
  const { count } = await supabase
    .from("demandes")
    .select("id", { count: "exact", head: true })
    .eq("auteur", moi)
    .eq("statut", "en_attente");
  return count ?? 0;
});

// Pour la fiche d'une annonce : ma demande (si j'en ai fait une) et, si elle est acceptée, les coordonnées de l'auteur.
export async function chargerMaDemande(annonceId, moiId, auteurId) {
  const supabase = await creerClient();
  const { data: demande } = await supabase
    .from("demandes")
    .select("id, statut, message, cree_le")
    .eq("annonce", annonceId)
    .eq("demandeur", moiId)
    .maybeSingle();
  if (demande?.statut !== "acceptee") return { demande, coordonnees: null };
  const { data: coordonnees } = await supabase
    .from("coordonnees")
    .select("email, telephone, instagram")
    .eq("personne", auteurId)
    .maybeSingle();
  return { demande, coordonnees };
}

// Pour l'auteur : combien de demandes il a reçues sur cette annonce, dont en attente.
export async function compterDemandesAnnonce(annonceId) {
  const supabase = await creerClient();
  const { data } = await supabase.from("demandes").select("statut").eq("annonce", annonceId);
  const liste = data ?? [];
  return { total: liste.length, enAttente: liste.filter((d) => d.statut === "en_attente").length };
}
