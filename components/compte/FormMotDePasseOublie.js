"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { demanderNouveauMotDePasse } from "../../lib/actions/compte";

export default function FormMotDePasseOublie() {
  const [etat, action, enCours] = useActionState(demanderNouveauMotDePasse, {});
  const e = etat.erreurs ?? {};

  if (etat.envoye) {
    return (
      <div className="carte carte--ombre-rouge carte--gauche">
        <h3>Regarde tes e-mails</h3>
        <p style={{ margin: 0 }}>
          Si un compte existe pour <strong>{etat.email}</strong>, tu vas recevoir un lien pour choisir un nouveau mot
          de passe. Pense aux spams.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      <Champ id="email" name="email" type="email" label="E-mail de ton compte" autoComplete="email" defaultValue={etat.email} erreur={e.email} />
      <button type="submit" className="bouton bouton--principal" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir un lien"}
      </button>
    </form>
  );
}
