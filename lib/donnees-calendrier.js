import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";

// Mes rendez-vous (accords en cours), à venir d'abord. null tant que la migration du lot 19 n'est pas appliquée.
export async function chargerMesRendezVous() {
  const supabase = await creerClient();
  const { data, error } = await supabase.rpc("mes_rendez_vous");
  if (error || !data) return null;
  const profils = await profilsVisibles([...new Set(data.map((r) => r.autre))]);
  return data.map((r) => ({ ...r, autreProfil: profils[r.autre] }));
}

// Un seul rendez-vous (pour l'agenda du téléphone).
export async function chargerRendezVous(demande) {
  const lignes = (await chargerMesRendezVous()) ?? [];
  return lignes.find((r) => r.demande === demande) ?? null;
}
