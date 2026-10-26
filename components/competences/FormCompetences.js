"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import { ajouterCompetence, supprimerCompetence } from "../../lib/actions/competences";
import { MAX_COMPETENCES, NOM_COMPETENCE_MAX } from "../../lib/competences";

// Mes compétences : j'en ajoute (12 au plus) et je les retire. Les autres étudiants les confirment dans leurs avis.
export default function FormCompetences({ competences }) {
  const [etat, action, enCours] = useActionState(ajouterCompetence, { nom: "" });
  const complet = competences.length >= MAX_COMPETENCES;
  return (
    <div className="formulaire carte-privee carte-privee--ouverte">
      {competences.length > 0 && (
        <ul className="competences">
          {competences.map((c) => (
            <li key={c.id} className={`competence${c.validations ? " competence--validee" : ""}`}>
              {c.nom}
              {c.validations > 0 && <span className="competence__valid">✓ {c.validations}</span>}
              <form action={supprimerCompetence.bind(null, c.id)}>
                <button type="submit" className="competence__retirer" aria-label={`Retirer la compétence ${c.nom}`}>
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="formulaire" noValidate key={etat.tentative ?? 0}>
        <Champ
          id="competence"
          name="nom"
          label="Ajouter une compétence"
          placeholder="ex. Montage vidéo, Python, Maths L1…"
          maxLength={NOM_COMPETENCE_MAX}
          defaultValue={etat.nom}
          erreur={etat.erreur}
          disabled={complet}
          aide={complet ? `${MAX_COMPETENCES} compétences au maximum.` : `${competences.length}/${MAX_COMPETENCES}. Une coche apparaît quand des étudiants la confirment.`}
        />
        <button type="submit" className="bouton bouton--principal" disabled={enCours || complet}>
          {enCours ? "Ajout…" : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
