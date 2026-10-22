"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { connecter } from "../../lib/actions/compte";

export default function FormConnexion({ suite, erreurLien }) {
  const [etat, action, enCours] = useActionState(connecter, {});
  const e = etat.erreurs ?? {};
  const message = etat.message ?? (erreurLien ? "Ce lien n'est plus valable. Connecte-toi, ou réinscris-toi si ton compte n'est pas activé." : null);

  return (
    <form action={action} className="formulaire" noValidate>
      {message && <Message>{message}</Message>}
      <input type="hidden" name="suite" value={suite} />
      <Champ id="email" name="email" type="email" label="E-mail" autoComplete="email" defaultValue={etat.email} erreur={e.email} />
      <Champ
        id="motDePasse"
        name="motDePasse"
        type="password"
        label="Mot de passe"
        autoComplete="current-password"
        erreur={e.motDePasse}
      />
      <button type="submit" className="bouton bouton--principal" disabled={enCours}>
        {enCours ? "Connexion…" : "Me connecter"}
      </button>
    </form>
  );
}
