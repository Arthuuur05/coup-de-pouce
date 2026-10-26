"use client";

import { useActionState } from "react";
import { signaler } from "../../lib/actions/signalements";
import { MOTIFS, DETAIL_MAX } from "../../lib/signalements";

// « Signaler » discret en bas d'une annonce ou d'un profil : un motif, un mot facultatif, et c'est envoyé à l'admin.
// cible : "annonce" ou "profil".
export default function Signaler({ cible, id }) {
  const [etat, action, enCours] = useActionState(signaler.bind(null, cible, id), {});
  if (etat.envoye) {
    return (
      <p className="champ__aide" role="status" style={{ margin: 0 }}>
        Merci, ton signalement est envoyé. L'administratrice va le regarder.
      </p>
    );
  }
  return (
    <details className="signaler">
      <summary>Signaler {cible === "annonce" ? "cette annonce" : "ce profil"}</summary>
      <form action={action} className="signaler__formulaire">
        <label className="champ__label" htmlFor={`motif-${id}`}>
          Pourquoi ?
        </label>
        <select id={`motif-${id}`} name="motif" className="champ__input" defaultValue={etat.motif ?? ""} required>
          <option value="">Choisir…</option>
          {Object.entries(MOTIFS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>
        <label className="champ__label" htmlFor={`detail-${id}`}>
          Un mot pour expliquer (facultatif)
        </label>
        <textarea id={`detail-${id}`} name="detail" className="champ__input champ__input--multiligne" maxLength={DETAIL_MAX} defaultValue={etat.detail ?? ""} />
        {etat.erreur && (
          <div className="message message--erreur" role="alert">
            {etat.erreur}
          </div>
        )}
        <button type="submit" className="bouton bouton--secondaire" disabled={enCours}>
          {enCours ? "Envoi…" : "Envoyer le signalement"}
        </button>
      </form>
    </details>
  );
}
