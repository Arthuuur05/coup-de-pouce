"use client";

import { useActionState, useState } from "react";
import Message from "../ui/Message";
import { envoyerCv, supprimerCv } from "../../lib/actions/competences";
import { CV_POIDS_MAX } from "../../lib/competences";

// Mon CV en PDF : visible seulement par moi et par les contacts qui ont une demande acceptée avec moi.
export default function FormCv({ cv }) {
  const [etat, action, enCours] = useActionState(envoyerCv, {});
  const [probleme, setProbleme] = useState(null);
  const [nom, setNom] = useState("");

  function choisir(evt) {
    const fichier = evt.target.files?.[0];
    setProbleme(null);
    setNom(fichier?.name ?? "");
    if (!fichier) return;
    if (fichier.type !== "application/pdf") setProbleme("Seul le format PDF est accepté.");
    else if (fichier.size > CV_POIDS_MAX) setProbleme("Ce fichier est trop lourd (5 Mo maximum).");
    if (fichier.type !== "application/pdf" || fichier.size > CV_POIDS_MAX) evt.target.value = "";
  }

  const erreur = probleme ?? etat.erreur;
  return (
    <div className="formulaire carte-privee">
      <p className="carte-privee__note">
        Ton CV reste privé : seuls tes contacts acceptés peuvent le télécharger, comme tes coordonnées.
      </p>
      {cv && (
        <p style={{ margin: 0 }}>
          CV actuel :{" "}
          <a href={cv.adresse} target="_blank" rel="noreferrer">
            {cv.nom}
          </a>
        </p>
      )}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <form action={action} className="formulaire" noValidate key={etat.tentative ?? 0}>
        <div className={`champ${erreur ? " champ--erreur" : ""}`}>
          <span className="champ__label">{cv ? "Remplacer mon CV" : "Ajouter mon CV"}</span>
          <div className="champ-photo__boutons">
            <label htmlFor="cv" className="bouton bouton--secondaire">
              {nom || "Choisir un PDF"}
            </label>
          </div>
          <input id="cv" name="cv" type="file" accept="application/pdf" className="visuellement-cache" onChange={choisir} />
          {erreur ? <span className="champ__erreur">{erreur}</span> : <span className="champ__aide">PDF, 5 Mo maximum.</span>}
        </div>
        <button type="submit" className="bouton bouton--principal" disabled={enCours || Boolean(probleme)}>
          {enCours ? "Envoi…" : "Enregistrer le CV"}
        </button>
      </form>
      {cv && (
        <form action={supprimerCv}>
          <button type="submit" className="bouton bouton--danger demande__petit">
            Supprimer mon CV
          </button>
        </form>
      )}
    </div>
  );
}
