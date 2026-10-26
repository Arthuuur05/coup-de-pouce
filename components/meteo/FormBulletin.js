"use client";

import { useActionState } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import { enregistrerBulletin } from "../../lib/actions/meteo";
import { TITRE_MAX, TEXTE_MAX } from "../../lib/meteo";

// Relecture du bulletin : modifier, enregistrer, publier ou repasser en brouillon.
export default function FormBulletin({ bulletin }) {
  const [etat, action, enCours] = useActionState(enregistrerBulletin.bind(null, bulletin.id), {
    valeurs: { titre: bulletin.titre, texte: bulletin.texte },
  });
  const v = etat.valeurs;
  const e = etat.erreurs ?? {};
  const publie = bulletin.statut === "publie";
  return (
    <form action={action} className="formulaire" noValidate>
      {etat.message && <Message>{etat.message}</Message>}
      {etat.ok && <Message type="ok">{etat.ok}</Message>}
      <Champ id="bulletinTitre" name="titre" label="Titre" maxLength={TITRE_MAX} defaultValue={v.titre} erreur={e.titre} />
      <Champ
        id="bulletinTexte"
        name="texte"
        label="Texte"
        multiligne
        maxLength={TEXTE_MAX}
        defaultValue={v.texte}
        erreur={e.texte}
      />
      <div className="demande__boutons">
        <button type="submit" name="intent" value="enregistrer" className="bouton bouton--secondaire" disabled={enCours}>
          Enregistrer
        </button>
        {publie ? (
          <button type="submit" name="intent" value="depublier" className="bouton bouton--danger" disabled={enCours}>
            Dépublier
          </button>
        ) : (
          <button type="submit" name="intent" value="publier" className="bouton bouton--accent" disabled={enCours}>
            Publier
          </button>
        )}
      </div>
    </form>
  );
}
