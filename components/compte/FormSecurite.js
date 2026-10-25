"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { changerMotDePasse, changerEmail } from "../../lib/actions/compte";
import { MOT_DE_PASSE_MIN } from "../../lib/compte";

export function FormMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, {});
  const e = etat.erreurs ?? {};
  return (
    <form action={action} className="formulaire" noValidate>
      <h3>Mot de passe</h3>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <Champ id="actuel" name="actuel" type="password" label="Mot de passe actuel" autoComplete="current-password" erreur={e.actuel} />
      <div className="champs-duo">
        <Champ
          id="nouveau"
          name="motDePasse"
          type="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          aide={`Au moins ${MOT_DE_PASSE_MIN} caractères.`}
          erreur={e.motDePasse}
        />
        <Champ id="confirmation" name="confirmation" type="password" label="Encore une fois" autoComplete="new-password" erreur={e.confirmation} />
      </div>
      <button type="submit" className="bouton bouton--secondaire" disabled={enCours}>
        {enCours ? "Changement…" : "Changer mon mot de passe"}
      </button>
    </form>
  );
}

export function FormEmail({ emailActuel }) {
  const [etat, action, enCours] = useActionState(changerEmail, {});
  const e = etat.erreurs ?? {};
  return (
    <form action={action} className="formulaire" noValidate>
      <h3>Adresse e-mail</h3>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <Champ
        id="nouvelEmail"
        name="email"
        type="email"
        label="Nouvelle adresse"
        autoComplete="email"
        aide={`Adresse actuelle : ${emailActuel}`}
        defaultValue={etat.email}
        erreur={e.email}
      />
      <button type="submit" className="bouton bouton--secondaire" disabled={enCours}>
        {enCours ? "Envoi…" : "Changer mon e-mail"}
      </button>
    </form>
  );
}
