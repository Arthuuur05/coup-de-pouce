"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { MESSAGE_MAX } from "../../lib/demandes";

// « Demander le contact » sur une annonce, avec un petit message facultatif.
// action : demanderContact.bind(null, idAnnonce). sansCoordonnees : je n'ai encore rien rempli.
export default function FormDemande({ action, prenom, sansCoordonnees }) {
  const [etat, envoyer, enCours] = useActionState(action, {});
  const [message, setMessage] = useState(etat.message ?? "");
  return (
    <form action={envoyer} className="formulaire demande-form" noValidate>
      <Champ
        id="messageDemande"
        name="message"
        label={`Un mot pour ${prenom || "l'auteur"} (facultatif)`}
        multiligne
        rows={4}
        maxLength={MESSAGE_MAX}
        placeholder="ex. Salut ! Tu serais dispo vendredi soir ?"
        compteur={`${message.length}/${MESSAGE_MAX}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        erreur={etat.erreur}
      />
      {sansCoordonnees && (
        <Message type="ok">
          Pense à remplir tes coordonnées dans <Link href="/profil#mes-coordonnees">ton profil</Link> : {prenom || "l'auteur"} les verra en
          cas d'accord.
        </Message>
      )}
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Envoi…" : "Demander le contact"}
      </button>
    </form>
  );
}
