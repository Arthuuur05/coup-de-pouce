import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";
import { moyenne } from "./competences";

// Les compétences d'une personne, chacune avec le nombre d'avis qui la confirment (« validée » dès le premier).
export async function chargerCompetences(personne) {
  const supabase = await creerClient();
  const [{ data: competences }, { data: avis }] = await Promise.all([
    supabase.from("competences").select("id, nom").eq("personne", personne).order("cree_le"),
    supabase.from("avis").select("competence").eq("cible", personne).not("competence", "is", null),
  ]);
  const validations = {};
  for (const a of avis ?? []) validations[a.competence] = (validations[a.competence] ?? 0) + 1;
  return (competences ?? []).map((c) => ({ ...c, validations: validations[c.id] ?? 0 }));
}

// Les avis reçus par une personne (les plus récents d'abord), avec l'auteur, et leur moyenne sur l'ensemble.
export async function chargerAvis(personne) {
  const supabase = await creerClient();
  const [{ data: notes }, { data: derniers }] = await Promise.all([
    supabase.from("avis").select("note").eq("cible", personne),
    supabase
      .from("avis")
      .select("id, auteur, note, commentaire, competence, cree_le")
      .eq("cible", personne)
      .order("cree_le", { ascending: false })
      .limit(20),
  ]);
  const liste = derniers ?? [];
  const [auteurs, { data: noms }] = await Promise.all([
    profilsVisibles(liste.map((a) => a.auteur)),
    liste.some((a) => a.competence)
      ? supabase.from("competences").select("id, nom").in("id", liste.map((a) => a.competence).filter(Boolean))
      : Promise.resolve({ data: [] }),
  ]);
  const nomDe = Object.fromEntries((noms ?? []).map((c) => [c.id, c.nom]));
  return {
    total: (notes ?? []).length,
    moyenne: moyenne(notes ?? []),
    avis: liste.map((a) => ({ ...a, auteurProfil: auteurs[a.auteur], competenceNom: nomDe[a.competence] ?? null })),
  };
}

// Les ids des demandes pour lesquelles j'ai déjà donné mon avis.
export async function chargerDemandesNotees(moiId) {
  const supabase = await creerClient();
  const { data } = await supabase.from("avis").select("demande").eq("auteur", moiId).not("demande", "is", null);
  return new Set((data ?? []).map((a) => a.demande));
}

// Les compétences d'autres personnes, rangées par personne (pour proposer laquelle confirmer dans un avis).
export async function chargerCompetencesDe(ids) {
  const uniques = [...new Set(ids)];
  if (!uniques.length) return {};
  const supabase = await creerClient();
  const { data } = await supabase.from("competences").select("id, nom, personne").in("personne", uniques).order("cree_le");
  const rangees = {};
  for (const c of data ?? []) (rangees[c.personne] ??= []).push({ id: c.id, nom: c.nom });
  return rangees;
}

// Le CV d'une personne avec une adresse temporaire (1 h), ou null. La base ne le montre qu'à son propriétaire
// et à ses contacts acceptés.
export async function chargerCv(personne) {
  const supabase = await creerClient();
  const { data } = await supabase.from("cvs").select("chemin, nom_fichier, modifie_le").eq("personne", personne).maybeSingle();
  if (!data) return null;
  const { data: signe } = await supabase.storage.from("cv").createSignedUrl(data.chemin, 3600, { download: data.nom_fichier });
  return signe?.signedUrl ? { adresse: signe.signedUrl, nom: data.nom_fichier, modifieLe: data.modifie_le } : null;
}
