"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { definirNouveauMotDePasse } from "../../lib/actions/compte";
import { MOT_DE_PASSE_MIN } from "../../lib/compte";

export default function FormNouveauMotDePasse() {
  const [etat, action, enCours] = useActionState(definirNouveauMotDePasse, {});
  const e = etat.erreurs ?? {};

  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      <Champ
        id="motDePasse"
        name="motDePasse"
        type="password"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        aide={`Au moins ${MOT_DE_PASSE_MIN} caractères.`}
        erreur={e.motDePasse}
      />
      <Champ id="confirmation" name="confirmation" type="password" label="Encore une fois" autoComplete="new-password" erreur={e.confirmation} />
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer et continuer"}
      </button>
    </form>
  );
}
