"use client";

import { useActionState } from "react";
import ChampPhoto from "../ui/ChampPhoto";
import Message from "../ui/Message";
import { changerPhotoProfil } from "../../lib/actions/compte";

// Photo de profil : carrée, recadrée au centre, visible seulement par les étudiants connectés.
export default function FormPhotoProfil({ photo }) {
  const [etat, action, enCours] = useActionState(changerPhotoProfil, {});
  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <ChampPhoto
        key={etat.tentative ?? 0}
        id="photoProfil"
        label="Photo de profil"
        carre
        photoActuelle={photo}
        erreur={etat.erreurs?.photo}
        aide="Carrée, recadrée au centre. Visible seulement par les étudiants connectés."
      />
      <button type="submit" className="bouton bouton--principal" disabled={enCours}>
        {enCours ? "Envoi…" : "Enregistrer la photo"}
      </button>
    </form>
  );
}
