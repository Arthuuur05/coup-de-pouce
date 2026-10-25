"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { supprimerCompte } from "../../lib/actions/compte";
import { MOT_DE_CONFIRMATION } from "../../lib/compte";

export default function FormSupprimerCompte() {
  const [etat, action, enCours] = useActionState(supprimerCompte, {});
  const e = etat.erreurs ?? {};
  return (
    <form action={action} className="formulaire zone-danger" noValidate>
      <h3>Supprimer mon compte</h3>
      <p style={{ margin: 0 }}>
        Ton profil, tes annonces et tes demandes sont effacés pour de bon. Impossible de revenir en arrière.
      </p>
      {etat.message && <Message>{etat.message}</Message>}
      <Champ
        id="confirmationSuppression"
        name="confirmation"
        label={`Tape ${MOT_DE_CONFIRMATION} pour confirmer`}
        autoComplete="off"
        erreur={e.confirmation}
      />
      <button type="submit" className="bouton bouton--danger" disabled={enCours}>
        {enCours ? "Suppression…" : "Supprimer définitivement"}
      </button>
    </form>
  );
}
