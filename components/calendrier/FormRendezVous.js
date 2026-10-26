"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { fixerRendezVous } from "../../lib/actions/calendrier";
import { LIEU_MAX } from "../../lib/calendrier";

// Fixer ou changer le rendez-vous. quandActuel : « 2026-11-03T14:30 » à l'heure de Paris (ou vide) ; minimum : maintenant, au même format.
export default function FormRendezVous({ demandeId, quandActuel = "", lieuActuel = "", minimum }) {
  const [etat, action, enCours] = useActionState(fixerRendezVous.bind(null, demandeId), {});
  const id = `rdv-${demandeId}`;
  return (
    <form action={action} className="formulaire rdv__form" noValidate>
      {etat.erreur && <Message>{etat.erreur}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <div className="rdv__champs">
        <Champ id={`${id}-quand`} label="Date et heure" name="quand" type="datetime-local" min={minimum} defaultValue={etat.quand ?? quandActuel} required />
        <Champ
          id={`${id}-lieu`}
          label="Lieu (facultatif)"
          name="lieu"
          maxLength={LIEU_MAX}
          defaultValue={etat.lieu ?? lieuActuel}
          placeholder="Bibliothèque, salle B12, visio…"
        />
      </div>
      <button type="submit" className="bouton bouton--accent demande__petit" disabled={enCours}>
        {enCours ? "Enregistrement…" : quandActuel ? "Modifier le rendez-vous" : "Fixer le rendez-vous"}
      </button>
    </form>
  );
}
