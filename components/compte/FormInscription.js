"use client";

import { useActionState } from "react";
import Link from "next/link";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { inscrire } from "../../lib/actions/compte";
import { ANNEES, MOT_DE_PASSE_MIN } from "../../lib/compte";

export default function FormInscription() {
  const [etat, action, enCours] = useActionState(inscrire, {});
  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};

  if (etat.envoye) {
    return (
      <div className="carte carte--ombre-rouge carte--gauche">
        <h3>Vérifie ta boîte mail</h3>
        <p style={{ margin: 0 }}>
          On a envoyé un lien à <strong>{etat.email}</strong>. Clique dessus pour activer ton compte, puis tu
          arriveras directement sur les annonces.
        </p>
        <p className="carte__date" style={{ margin: 0 }}>
          Rien reçu ? Regarde dans les spams, ou <Link href="/inscription">recommence</Link>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      <div className="champs-duo">
        <Champ id="prenom" name="prenom" label="Prénom" autoComplete="given-name" defaultValue={v.prenom} erreur={e.prenom} />
        <Champ
          id="nom"
          name="nom"
          label="Nom"
          autoComplete="family-name"
          aide="Jamais affiché aux autres."
          defaultValue={v.nom}
          erreur={e.nom}
        />
      </div>
      <Champ id="email" name="email" type="email" label="E-mail" autoComplete="email" defaultValue={v.email} erreur={e.email} />
      <Champ
        id="motDePasse"
        name="motDePasse"
        type="password"
        label="Mot de passe"
        autoComplete="new-password"
        aide={`Au moins ${MOT_DE_PASSE_MIN} caractères.`}
        erreur={e.motDePasse}
      />
      <div className="champs-duo">
        <Champ id="filiere" name="filiere" label="Filière" placeholder="ex. Communication digitale" defaultValue={v.filiere} erreur={e.filiere} />
        <Champ id="annee" name="annee" label="Année" options={ANNEES} defaultValue={v.annee ?? ""} erreur={e.annee} />
      </div>
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
