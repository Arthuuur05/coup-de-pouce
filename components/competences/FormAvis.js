"use client";

import { useActionState } from "react";
import Message from "../ui/Message";
import Champ from "../ui/Champ";
import { IconeEtoile } from "../ui/Icones";
import { donnerAvis } from "../../lib/actions/competences";
import { NOTES, COMMENTAIRE_MAX } from "../../lib/competences";

// Mon avis sur l'autre personne d'une demande acceptée : une note, un mot, et une compétence à confirmer.
export default function FormAvis({ demandeId, prenom, competences }) {
  const [etat, action, enCours] = useActionState(donnerAvis.bind(null, demandeId), {});
  const v = etat.valeurs ?? {};
  if (etat.ok) return <Message type="ok">{etat.ok}</Message>;
  return (
    <form action={action} className="avis-form" noValidate>
      <h4 className="avis-form__titre">Ton avis sur {prenom || "ce contact"}</h4>
      {etat.erreur && <Message>{etat.erreur}</Message>}
      <fieldset className="note-choix">
        <legend className="visuellement-cache">Ta note sur 5</legend>
        {[...NOTES].reverse().map((n) => (
          <label key={n.valeur} className="note-choix__etoile" title={n.texte}>
            <input type="radio" name="note" value={n.valeur} defaultChecked={v.note === n.valeur} required />
            <IconeEtoile plein width={30} height={30} />
            <span className="visuellement-cache">{n.valeur} sur 5 : {n.texte}</span>
          </label>
        ))}
      </fieldset>
      <Champ
        id={`avis-${demandeId}`}
        name="commentaire"
        label="Un mot (facultatif)"
        multiligne
        maxLength={COMMENTAIRE_MAX}
        defaultValue={v.commentaire}
        placeholder="Comment ça s'est passé ?"
      />
      {competences.length > 0 && (
        <div className="champ">
          <label htmlFor={`comp-${demandeId}`} className="champ__label">
            Confirmer une compétence (facultatif)
          </label>
          <select id={`comp-${demandeId}`} name="competence" className="champ__input" defaultValue={v.competence ?? ""}>
            <option value="">Aucune</option>
            {competences.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Publication…" : "Publier mon avis"}
      </button>
      <p className="champ__aide" style={{ margin: 0 }}>
        Ton avis est public, avec ton prénom. Tu pourras le retirer depuis son profil.
      </p>
    </form>
  );
}
