import { creerClient } from "./supabase/server";
import { adressesPhotos } from "./photos";
import { sansAccents, PAR_PAGE } from "./annonces";

const CHAMPS =
  "id, auteur, type, categorie, titre, description, contrepartie, quand, campus, filiere, photo, statut, cree_le, expire_le";

// Les mots de la recherche, sans accents ni caractères spéciaux (qui casseraient le filtre).
const motsRecherche = (q) =>
  sansAccents(q)
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

// Prénom, filière, année, campus et photo des auteurs (jamais le nom ni l'e-mail), rangés par id.
async function chargerAuteurs(supabase, ids) {
  const uniques = [...new Set(ids)];
  if (!uniques.length) return {};
  const [{ data: profils }, { data: photos }] = await Promise.all([
    supabase.rpc("profils_publics", { ids: uniques }),
    supabase.rpc("photos_profils", { ids: uniques }),
  ]);
  const photoDe = Object.fromEntries((photos ?? []).map((p) => [p.id, p.photo]));
  return Object.fromEntries((profils ?? []).map((p) => [p.id, { ...p, photo: photoDe[p.id] ?? "" }]));
}

// Prénom, filière, année, campus et adresse de la photo de quelques étudiants, rangés par id.
export async function profilsVisibles(ids) {
  const supabase = await creerClient();
  const profils = await chargerAuteurs(supabase, ids);
  const adresses = await adressesPhotos(supabase, Object.values(profils).map((p) => p.photo));
  return Object.fromEntries(Object.entries(profils).map(([id, p]) => [id, { ...p, photoUrl: adresses[p.photo] ?? null }]));
}

// Ajoute aux annonces leur auteur et les adresses des photos (annonce et auteur).
async function completer(supabase, annonces) {
  const auteurs = await chargerAuteurs(supabase, annonces.map((a) => a.auteur));
  const adresses = await adressesPhotos(supabase, [
    ...annonces.map((a) => a.photo),
    ...Object.values(auteurs).map((p) => p.photo),
  ]);
  return annonces.map((a) => {
    const auteur = auteurs[a.auteur];
    return {
      ...a,
      photoUrl: adresses[a.photo] ?? null,
      auteurProfil: auteur ? { ...auteur, photoUrl: adresses[auteur.photo] ?? null } : undefined,
    };
  });
}

// Les ids des annonces que j'ai mises en favori.
export async function chargerIdsFavoris() {
  const supabase = await creerClient();
  const { data } = await supabase.from("favoris").select("annonce");
  return new Set((data ?? []).map((f) => f.annonce));
}

// Le fil : annonces en ligne, les plus récentes d'abord, filtrées, 30 par page.
// filtres : { q, type, categorie, campus, vue, page } ; moi : profil connecté (id, campus, filière).
export async function chargerFil(filtres, moi, idsFavoris) {
  const supabase = await creerClient();
  const nombre = PAR_PAGE * Math.max(1, filtres.page || 1);
  let requete = supabase
    .from("annonces")
    .select(CHAMPS)
    .eq("statut", "active")
    .gt("expire_le", new Date().toISOString())
    .order("cree_le", { ascending: false })
    .limit(nombre + 1);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.categorie) requete = requete.eq("categorie", filtres.categorie);
  if (filtres.campus) requete = requete.eq("campus", filtres.campus);
  for (const mot of motsRecherche(filtres.q)) requete = requete.ilike("texte_recherche", `%${mot}%`);

  // « Pour toi » : les annonces des autres, de mon campus ou de ma filière (mon campus seul si pas de filière).
  if (filtres.vue === "pour-toi" && moi) {
    const filiere = (moi.filiere ?? "").replace(/[^\p{L}\p{N}\s'-]/gu, "").trim();
    const conditions = [moi.campus && `campus.eq."${moi.campus}"`, filiere && `filiere.ilike."${filiere}"`].filter(Boolean);
    requete = requete.neq("auteur", moi.id);
    if (conditions.length) requete = requete.or(conditions.join(","));
  }
  if (filtres.vue === "favoris") {
    const ids = [...(idsFavoris ?? [])];
    if (!ids.length) return { annonces: [], encore: false, erreur: false };
    requete = requete.in("id", ids);
  }

  const { data, error } = await requete;
  if (error) return { annonces: [], encore: false, erreur: true };
  return { annonces: await completer(supabase, data.slice(0, nombre)), encore: data.length > nombre, erreur: false };
}

// Une annonce, son auteur et ses photos, ou null si elle n'existe pas ou n'est plus visible.
export async function chargerAnnonce(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const supabase = await creerClient();
  const { data } = await supabase.from("annonces").select(CHAMPS).eq("id", id).maybeSingle();
  if (!data) return null;
  return (await completer(supabase, [data]))[0];
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

// Mes favoris, même ceux qui ne sont plus en ligne.
export async function chargerMesFavoris() {
  const supabase = await creerClient();
  const { data } = await supabase.rpc("mes_favoris");
  return data ?? [];
}

// Le profil public d'un étudiant et ses annonces en ligne, ou null.
export async function chargerProfilPublic(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const supabase = await creerClient();
  const auteurs = await chargerAuteurs(supabase, [id]);
  const profil = auteurs[id];
  if (!profil) return null;
  const { data } = await supabase
    .from("annonces")
    .select(CHAMPS)
    .eq("auteur", id)
    .eq("statut", "active")
    .gt("expire_le", new Date().toISOString())
    .order("cree_le", { ascending: false });
  const annonces = await completer(supabase, data ?? []);
  const adresses = await adressesPhotos(supabase, [profil.photo]);
  return { profil: { ...profil, photoUrl: adresses[profil.photo] ?? null }, annonces };
}

// L'adresse de ma photo de profil (pour le menu et le profil), ou null.
export async function adresseMaPhoto(chemin) {
  if (!chemin) return null;
  const supabase = await creerClient();
  return (await adressesPhotos(supabase, [chemin]))[chemin] ?? null;
}
