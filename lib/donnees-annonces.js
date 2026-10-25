import { creerClient } from "./supabase/server";

const CHAMPS = "id, auteur, type, categorie, titre, description, contrepartie, quand, campus, statut, cree_le, expire_le";

// Garde les lettres, chiffres, espaces et tirets : le reste casserait le filtre de recherche.
const motPropre = (mot) =>
  String(mot ?? "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

// Prénom, filière, année, campus des auteurs (jamais le nom ni l'e-mail), rangés par id.
async function chargerAuteurs(supabase, ids) {
  const uniques = [...new Set(ids)];
  if (!uniques.length) return {};
  const { data } = await supabase.rpc("profils_publics", { ids: uniques });
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

// Le fil : annonces en ligne, les plus récentes d'abord, filtrées.
// filtres : { q, type, categorie, campus, pourToi } ; moi : profil connecté (campus, filière, id).
export async function chargerFil(filtres, moi) {
  const supabase = await creerClient();
  let requete = supabase
    .from("annonces")
    .select(CHAMPS)
    .eq("statut", "active")
    .gt("expire_le", new Date().toISOString())
    .order("cree_le", { ascending: false })
    .limit(100);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.categorie) requete = requete.eq("categorie", filtres.categorie);
  if (filtres.campus) requete = requete.eq("campus", filtres.campus);
  const mot = motPropre(filtres.q);
  if (mot) requete = requete.or(`titre.ilike."*${mot}*",description.ilike."*${mot}*"`);

  const { data, error } = await requete;
  if (error) return { annonces: [], erreur: true };
  const auteurs = await chargerAuteurs(supabase, data.map((a) => a.auteur));
  let annonces = data.map((a) => ({ ...a, auteurProfil: auteurs[a.auteur] }));

  // « Pour toi » : les annonces des autres, de mon campus ou de ma filière.
  if (filtres.pourToi && moi) {
    const maFiliere = (moi.filiere ?? "").trim().toLowerCase();
    annonces = annonces.filter(
      (a) =>
        a.auteur !== moi.id &&
        ((moi.campus && a.campus === moi.campus) ||
          (maFiliere && (a.auteurProfil?.filiere ?? "").trim().toLowerCase() === maFiliere))
    );
  }
  return { annonces, erreur: false };
}

// Une annonce et son auteur, ou null si elle n'existe pas ou n'est plus visible.
export async function chargerAnnonce(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const supabase = await creerClient();
  const { data } = await supabase.from("annonces").select(CHAMPS).eq("id", id).maybeSingle();
  if (!data) return null;
  const auteurs = await chargerAuteurs(supabase, [data.auteur]);
  return { ...data, auteurProfil: auteurs[data.auteur] };
}

// Toutes mes annonces : en ligne, réglées et expirées.
export async function chargerMesAnnonces(moiId) {
  const supabase = await creerClient();
  const { data } = await supabase
    .from("annonces")
    .select(CHAMPS)
    .eq("auteur", moiId)
    .order("cree_le", { ascending: false });
  return data ?? [];
}
