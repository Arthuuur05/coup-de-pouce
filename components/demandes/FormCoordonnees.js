"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { enregistrerCoordonnees } from "../../lib/actions/demandes";
import { LIMITES_COORDONNEES } from "../../lib/demandes";

// Mes coordonnées privées : chacune facultative, visibles seulement après un accord.
export default function FormCoordonnees({ coordonnees }) {
  const [etat, action, enCours] = useActionState(enregistrerCoordonnees, { valeurs: coordonnees });
  const v = etat.valeurs ?? {};
  const e = etat.erreurs ?? {};
  return (
    <form action={action} className="formulaire carte-privee" noValidate>
      <p className="carte-privee__note">
        Personne ne les voit tant que tu n'as pas accepté une demande (ou qu'on n'a pas accepté la tienne). Remplis-en au
        moins une pour qu'on puisse te joindre.
      </p>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <Champ
        id="coordEmail"
        name="email"
        type="email"
        label="E-mail de contact"
        placeholder="ex. lea@gmail.com"
        maxLength={LIMITES_COORDONNEES.email}
        defaultValue={v.email}
        erreur={e.email}
      />
      <div className="champs-duo">
        <Champ
          id="coordTelephone"
          name="telephone"
          type="tel"
          label="Téléphone"
          placeholder="ex. 06 12 34 56 78"
          maxLength={LIMITES_COORDONNEES.telephone}
          defaultValue={v.telephone}
          erreur={e.telephone}
        />
        <Champ
          id="coordInstagram"
          name="instagram"
          label="Instagram"
          placeholder="ex. lea.data"
          maxLength={60}
          defaultValue={v.instagram}
          erreur={e.instagram}
        />
      </div>
      <button type="submit" className="bouton bouton--principal" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer mes coordonnées"}
      </button>
    </form>
  );
}
