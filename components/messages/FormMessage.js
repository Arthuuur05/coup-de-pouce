"use client";

import { useActionState } from "react";
import { envoyerMessage } from "../../lib/actions/messages";
import { MESSAGE_MAX } from "../../lib/messages";

// Le champ d'écriture sous la conversation. Il se vide après l'envoi (key change avec `envoye`).
export default function FormMessage({ demandeId }) {
  const [etat, action, enCours] = useActionState(envoyerMessage.bind(null, demandeId), {});
  return (
    <form action={action} className="messagerie__ecrire" key={etat.envoye ?? "nouveau"}>
      <label className="visuellement-cache" htmlFor="texte-message">
        Ton message
      </label>
      <textarea
        id="texte-message"
        name="texte"
        className="champ__input champ__input--multiligne"
        maxLength={MESSAGE_MAX}
        defaultValue={etat.texte ?? ""}
        placeholder="Écris ton message…"
        aria-invalid={etat.erreur ? "true" : undefined}
        required
      />
      {etat.erreur && (
        <div className="message message--erreur" role="alert">
          {etat.erreur}
        </div>
      )}
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
