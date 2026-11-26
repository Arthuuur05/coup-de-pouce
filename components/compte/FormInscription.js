"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { inscrire } from "../../lib/actions/compte";
import { ANNEES, CAMPUS, ROLES, MOT_DE_PASSE_MIN } from "../../lib/compte";

export default function FormInscription() {
  const [etat, action, enCours] = useActionState(inscrire, {});
  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};
  const [role, setRole] = useState(v.role ?? "etudiant");
  const intervenant = role === "intervenant";

  if (etat.envoye) {
    return (
      <div className="carte carte--ombre-rouge carte--gauche">
        <h3>Vérifie ta boîte mail</h3>
        <p style={{ margin: 0 }}>
          On a envoyé un lien à <strong>{etat.email}</strong>. Clique dessus pour activer ton compte, puis tu
          pourras compléter ton profil en quelques étapes.
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
      <fieldset className="choix-type">
        <legend className="champ__label">Tu es…</legend>
        <div className="choix-type__options">
          {Object.entries(ROLES).map(([valeur, label]) => (
            <label key={valeur} className={`choix-type__option${role === valeur ? " choix-type__option--choisi" : ""}`}>
              <input type="radio" name="role" value={valeur} checked={role === valeur} onChange={() => setRole(valeur)} />
              {label}
            </label>
          ))}
        </div>
        {intervenant && (
          <span className="champ__aide">
            Pro, ancien ou formateur : tu proposes ton aide aux étudiants. Pas de filière ni d’année à indiquer.
          </span>
        )}
      </fieldset>
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
        <Champ
          id="filiere"
          name="filiere"
          label={intervenant ? "Métier ou organisation" : "Filière"}
          placeholder={intervenant ? "ex. Photographe indépendant" : "ex. Communication digitale"}
          defaultValue={v.filiere}
          erreur={e.filiere}
        />
        {!intervenant && <Champ id="annee" name="annee" label="Année" options={ANNEES} defaultValue={v.annee ?? ""} erreur={e.annee} />}
      </div>
      <Champ id="campus" name="campus" label="Campus" options={CAMPUS} defaultValue={v.campus ?? ""} erreur={e.campus} />
      <button type="submit" className="bouton bouton--accent" disabled={enCours}>
        {enCours ? "Création…" : "Créer mon compte"}
      </button>
      <p className="champ__aide" style={{ margin: 0 }}>
        En créant ton compte, tu acceptes notre façon de traiter tes{" "}
        <Link href="/donnees-personnelles">données personnelles</Link>.
      </p>
    </form>
  );
}
