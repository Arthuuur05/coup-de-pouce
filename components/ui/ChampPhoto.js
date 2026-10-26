"use client";

import { useRef, useState } from "react";

const FORMATS = ["image/jpeg", "image/png", "image/webp"];
const POIDS_MAX = 5 * 1024 * 1024;

// Réduit la photo dans le navigateur avant l'envoi : 1 600 px de large au plus (annonce),
// ou un carré de 512 px recadré au centre (profil). Aucun outil en plus : juste un canvas.
async function reduire(fichier, carre) {
  const image = await createImageBitmap(fichier);
  const cote = Math.min(image.width, image.height);
  const [sx, sy, sl, sh] = carre
    ? [(image.width - cote) / 2, (image.height - cote) / 2, cote, cote]
    : [0, 0, image.width, image.height];
  const echelle = Math.min(1, (carre ? 512 : 1600) / Math.max(sl, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sl * echelle);
  canvas.height = Math.round(sh * echelle);
  canvas.getContext("2d").drawImage(image, sx, sy, sl, sh, 0, 0, canvas.width, canvas.height);
  const versBlob = (type) => new Promise((ok) => canvas.toBlob(ok, type, 0.85));
  let blob = await versBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await versBlob("image/jpeg");
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `photo.${extension}`, { type: blob.type });
}

// Choix d'une photo avec aperçu. photoActuelle : adresse de la photo déjà enregistrée.
// onApercu(adresse | null) prévient le formulaire (pour l'aperçu de la carte).
export default function ChampPhoto({ id, label, carre = false, photoActuelle, erreur, onApercu, aide }) {
  const entree = useRef(null);
  const [apercu, setApercu] = useState(photoActuelle ?? null);
  const [retirer, setRetirer] = useState(false);
  const [probleme, setProbleme] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const montrer = (adresse) => {
    setApercu(adresse);
    onApercu?.(adresse);
  };

  async function choisir(evt) {
    const fichier = evt.target.files?.[0];
    setProbleme(null);
    if (!fichier) return;
    if (!FORMATS.includes(fichier.type)) {
      evt.target.value = "";
      setProbleme("Format accepté : JPG, PNG ou WebP.");
      return;
    }
    setEnCours(true);
    let final = fichier;
    try {
      final = await reduire(fichier, carre);
      const liste = new DataTransfer();
      liste.items.add(final);
      entree.current.files = liste.files;
    } catch {
      final = fichier; // Navigateur trop ancien : on envoie la photo telle quelle.
    }
    setEnCours(false);
    if (final.size > POIDS_MAX) {
      evt.target.value = "";
      setProbleme("Cette photo est trop lourde (5 Mo maximum).");
      return;
    }
    setRetirer(false);
    montrer(URL.createObjectURL(final));
  }

  function enlever() {
    if (entree.current) entree.current.value = "";
    setRetirer(Boolean(photoActuelle));
    montrer(null);
  }

  const message = probleme ?? erreur;
  return (
    <div className={`champ champ-photo${message ? " champ--erreur" : ""}`}>
      <span className="champ__label">{label}</span>
      <div className="champ-photo__corps">
        {apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="" className={`champ-photo__apercu${carre ? " champ-photo__apercu--carre" : ""}`} />
        ) : (
          <div className={`champ-photo__vide${carre ? " champ-photo__apercu--carre" : ""}`}>Pas de photo</div>
        )}
        <div className="champ-photo__boutons">
          <label htmlFor={id} className="bouton bouton--secondaire">
            {enCours ? "Préparation…" : apercu ? "Changer" : "Choisir une photo"}
          </label>
          {apercu && (
            <button type="button" className="bouton bouton--danger" onClick={enlever}>
              Retirer
            </button>
          )}
        </div>
      </div>
      <input
        ref={entree}
        id={id}
        name="photo"
        type="file"
        accept={FORMATS.join(",")}
        className="visuellement-cache"
        onChange={choisir}
        aria-describedby={message ? `${id}-erreur` : undefined}
      />
      {retirer && <input type="hidden" name="retirerPhoto" value="1" />}
      {aide && !message && <span className="champ__aide">{aide}</span>}
      {message && (
        <span id={`${id}-erreur`} className="champ__erreur">
          {message}
        </span>
      )}
    </div>
  );
}
