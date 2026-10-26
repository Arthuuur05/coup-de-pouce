// Photos (profil et annonces) dans l'espace privé « photos » de Supabase : un dossier par personne.
export const FORMATS_PHOTO = ["image/jpeg", "image/png", "image/webp"];
export const POIDS_MAX = 5 * 1024 * 1024;
const ESPACE = "photos";
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Une photo envoyée dans un formulaire, ou null s'il n'y en a pas.
export function lirePhoto(formData, nom = "photo") {
  const fichier = formData.get(nom);
  return fichier && typeof fichier === "object" && fichier.size > 0 ? fichier : null;
}

export function erreurPhoto(fichier) {
  if (!FORMATS_PHOTO.includes(fichier.type)) return "Format accepté : JPG, PNG ou WebP.";
  if (fichier.size > POIDS_MAX) return "5 Mo maximum.";
  return null;
}

// Envoie la photo dans le dossier de la personne. Renvoie son chemin, ou null en cas d'échec.
export async function envoyerPhoto(supabase, idPersonne, fichier, prefixe) {
  const chemin = `${idPersonne}/${prefixe}-${Date.now()}.${EXTENSIONS[fichier.type]}`;
  const { error } = await supabase.storage.from(ESPACE).upload(chemin, fichier, { contentType: fichier.type });
  return error ? null : chemin;
}

export async function supprimerPhotos(supabase, chemins) {
  const liste = chemins.filter(Boolean);
  if (liste.length) await supabase.storage.from(ESPACE).remove(liste);
}

// Tout le dossier d'une personne (avant la suppression de son compte).
export async function viderDossier(supabase, idPersonne) {
  const { data } = await supabase.storage.from(ESPACE).list(idPersonne, { limit: 1000 });
  await supprimerPhotos(supabase, (data ?? []).map((f) => `${idPersonne}/${f.name}`));
}

// Adresses temporaires (1 h) des photos, rangées par chemin. L'espace est privé : pas d'adresse publique.
export async function adressesPhotos(supabase, chemins) {
  const liste = [...new Set(chemins.filter(Boolean))];
  if (!liste.length) return {};
  const { data } = await supabase.storage.from(ESPACE).createSignedUrls(liste, 3600);
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}
