"use client";

import { useActionState, useState, startTransition } from "react";
import Champ from "../ui/Champ";
import Message from "../ui/Message";
import CarteAnnonce from "../ui/CarteAnnonce";
import ChampPhoto from "../ui/ChampPhoto";
import { TYPES, CATEGORIES, LIMITES } from "../../lib/annonces";

const VIDE = { type: "", categorie: "", titre: "", description: "", contrepartie: "", quand: "" };

// Publier ou modifier une annonce, avec l'aperçu de la carte qui se met à jour en direct.
// action : publierAnnonce, ou modifierAnnonce.bind(null, id). signature : « Léa · Design M1 ».
// photo : adresse de la photo déjà enregistrée (modification). auteur : { prenom, photoUrl } pour l'aperçu.
export default function FormAnnonce({ action, annonce, photo, auteur, signature, boutonTexte = "Publier mon annonce" }) {
  const [etat, envoyer, enCours] = useActionState(action, { valeurs: { ...VIDE, ...annonce } });
  const [v, setV] = useState(etat.valeurs);
  const [apercuPhoto, setApercuPhoto] = useState(photo ?? null);
  // Envoi à la main (et non action={…}) : en cas d'erreur, le formulaire n'est pas vidé et la photo choisie reste.
  const soumettre = (evt) => {
    evt.preventDefault();
    const donnees = new FormData(evt.currentTarget);
    startTransition(() => envoyer(donnees));
  };
  const e = etat.erreurs ?? {};
  const changer = (champ) => (evt) => setV((avant) => ({ ...avant, [champ]: evt.target.value }));
  const compteur = (champ) => `${v[champ].length}/${LIMITES[champ]}`;

  return (
    <div className="publier">
      <form id="form-annonce" onSubmit={soumettre} className="formulaire" noValidate>
        {etat.message && <Message>{etat.message}</Message>}

        <fieldset className="choix-type" aria-describedby={e.type ? "type-erreur" : undefined}>
          <legend className="champ__label">Tu proposes ou tu cherches ?</legend>
          <div className="choix-type__options">
            {Object.entries(TYPES).map(([valeur, label]) => (
              <label key={valeur} className={`choix-type__option${v.type === valeur ? " choix-type__option--choisi" : ""}`}>
                <input type="radio" name="type" value={valeur} checked={v.type === valeur} onChange={changer("type")} />
                {label}
              </label>
            ))}
          </div>
          {e.type && (
            <span id="type-erreur" className="champ__erreur">
              {e.type}
            </span>
          )}
        </fieldset>

        <Champ id="categorie" name="categorie" label="Catégorie" options={CATEGORIES} value={v.categorie} onChange={changer("categorie")} erreur={e.categorie} />
        <Champ
          id="titre"
          name="titre"
          label="Titre"
          placeholder="ex. Photos pour ta soirée d'asso"
          maxLength={LIMITES.titre}
          compteur={compteur("titre")}
          value={v.titre}
          onChange={changer("titre")}
          erreur={e.titre}
        />
        <Champ
          id="description"
          name="description"
          label="Description"
          multiligne
          rows={6}
          placeholder="Ce que tu proposes ou ce dont tu as besoin, en quelques phrases."
          maxLength={LIMITES.description}
          compteur={compteur("description")}
          value={v.description}
          onChange={changer("description")}
          erreur={e.description}
        />
        <ChampPhoto
          id="photo"
          label="Photo (facultatif)"
          photoActuelle={photo}
          onApercu={setApercuPhoto}
          erreur={e.photo}
          aide="JPG, PNG ou WebP. Réduite automatiquement."
        />
        <div className="champs-duo">
          <Champ
            id="quand"
            name="quand"
            label="Quand ? (facultatif)"
            placeholder="ex. vendredi soir"
            maxLength={LIMITES.quand}
            value={v.quand}
            onChange={changer("quand")}
            erreur={e.quand}
          />
          <Champ
            id="contrepartie"
            name="contrepartie"
            label="Contrepartie (facultatif)"
            placeholder="ex. un café, un échange"
            aide="Jamais d'argent sur Coup de Pouce."
            maxLength={LIMITES.contrepartie}
            value={v.contrepartie}
            onChange={changer("contrepartie")}
            erreur={e.contrepartie}
          />
        </div>
      </form>

      <aside className="publier__apercu" aria-label="Aperçu de ta carte">
        <div className="champ__label">Aperçu de ta carte</div>
        <CarteAnnonce
          type={v.type || "propose"}
          categorie={v.categorie || "Catégorie"}
          titre={v.titre || "Ton titre ici"}
          extrait={v.description || "Ta description apparaîtra ici."}
          auteur={signature}
          avatar={auteur}
          photo={apercuPhoto}
          date="à l'instant"
        />
        <p className="champ__aide">Ton nom de famille et ton e-mail ne sont jamais affichés.</p>
      </aside>

      {/* Hors du formulaire pour venir après l'aperçu sur téléphone ; relié par form="form-annonce". */}
      <button type="submit" form="form-annonce" className="bouton bouton--accent publier__envoyer" disabled={enCours}>
        {enCours ? "Envoi…" : boutonTexte}
      </button>
    </div>
  );
}
