"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { modifierProfil } from "../../lib/actions/compte";
import { ANNEES } from "../../lib/compte";

export default function FormProfil({ profil }) {
  const [etat, action, enCours] = useActionState(modifierProfil, { valeurs: profil });
  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};

  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <Champ id="prenom" name="prenom" label="Prénom" autoComplete="given-name" defaultValue={v.prenom} erreur={e.prenom} />
      <Champ id="filiere" name="filiere" label="Filière" placeholder="ex. Communication digitale" defaultValue={v.filiere} erreur={e.filiere} />
      <Champ id="annee" name="annee" label="Année" options={ANNEES} defaultValue={v.annee ?? ""} erreur={e.annee} />
      <Champ id="campus" name="campus" label="Campus" placeholder="ex. Paris" defaultValue={v.campus} erreur={e.campus} />
      <button type="submit" className="bouton bouton--principal" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
