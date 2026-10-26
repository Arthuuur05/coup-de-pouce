"use client";

import { useId, useState } from "react";
import Message from "../ui/Message";
import { proposerRedaction } from "../../lib/aide/redaction";
import { TYPES } from "../../lib/annonces";

const EXEMPLES = ["photos soirée asso", "cherche aide en maths vendredi soir", "covoiturage Lyon Paris ce week-end", "logo pour mon asso"];

// « Un coup de main pour rédiger » : quelques mots → type, catégorie, trois propositions de titre et de description.
// Les suggestions sont fabriquées sur place avec des modèles de phrases et des mots-clés (pas de modèle d'IA, rien n'est envoyé).
// valeurs : ce qui est déjà dans le formulaire ; appliquer(champs) : remplit le formulaire.
export default function AideRedaction({ valeurs, appliquer, campusMoi }) {
  const id = useId();
  const [saisie, setSaisie] = useState("");
  const [resultat, setResultat] = useState(null);
  const [choisie, setChoisie] = useState("");

  const proposer = () => {
    if (saisie.trim().length < 3) {
      setResultat({ vide: true });
      return;
    }
    setChoisie("");
    setResultat(proposerRedaction(saisie, { typeChoisi: valeurs.type, categorieChoisie: valeurs.categorie, campusMoi }));
  };

  const utiliser = (p) => {
    const c = resultat.comprehension;
    appliquer({
      type: valeurs.type || c.type,
      categorie: c.categorieSure ? c.categorie : valeurs.categorie,
      titre: p.titre,
      description: p.description,
      quand: valeurs.quand || c.quand,
      contrepartie: valeurs.contrepartie || c.contrepartie,
    });
    setChoisie(p.cle);
  };

  const c = resultat?.comprehension;
  return (
    <details className="aide-redaction" open>
      <summary className="aide-redaction__titre">✨ Un coup de main pour rédiger</summary>
      <div className="aide-redaction__corps">
        <label htmlFor={`${id}-mots`} className="champ__label">
          Écris ton annonce en quelques mots
        </label>
        <div className="aide-redaction__saisie">
          <input
            id={`${id}-mots`}
            className="champ__input"
            value={saisie}
            maxLength={200}
            placeholder="ex. photos soirée asso"
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                proposer();
              }
            }}
          />
          <button type="button" className="bouton bouton--secondaire" onClick={proposer}>
            Me proposer une rédaction
          </button>
        </div>
        {!resultat && (
          <p className="champ__aide" style={{ margin: 0 }}>
            Essaie par exemple :{" "}
            {EXEMPLES.map((e, i) => (
              <span key={e}>
                {i > 0 && " · "}
                <button type="button" className="aide-redaction__exemple" onClick={() => setSaisie(e)}>
                  {e}
                </button>
              </span>
            ))}
          </p>
        )}
        <p className="champ__aide" style={{ margin: 0 }}>
          Ce sont des suggestions automatiques, fabriquées avec des modèles de phrases et des mots-clés : ce n'est pas une intelligence
          artificielle. Relis et corrige avant de publier.
        </p>

        <div aria-live="polite">
          {resultat?.vide && <Message>Écris au moins quelques mots, par exemple « photos soirée asso ».</Message>}
          {c && (
            <>
              <ul className="aide-redaction__compris" aria-label="Ce que j'ai compris">
                <li>
                  {TYPES[c.type]}
                  {!c.typeSur && " (à confirmer)"}
                </li>
                <li>
                  {c.categorieSure ? c.categorie : "Catégorie à choisir"}
                  {c.autreCategorie && ` (ou ${c.autreCategorie} ?)`}
                </li>
                {c.quand && <li>Quand : {c.quand}</li>}
                {c.contrepartie && <li>En échange : {c.contrepartie}</li>}
              </ul>
              {resultat.avertissements.map((a) => (
                <Message key={a}>{a}</Message>
              ))}
              <ol className="aide-redaction__propositions">
                {resultat.propositions.map((p) => (
                  <li key={p.cle} className={`aide-proposition${choisie === p.cle ? " aide-proposition--choisie" : ""}`}>
                    <span className="aide-proposition__nom">{p.nom}</span>
                    <strong className="aide-proposition__titre">{p.titre}</strong>
                    <span className="aide-proposition__texte">{p.description}</span>
                    <button type="button" className="bouton bouton--accent demande__petit" onClick={() => utiliser(p)}>
                      {choisie === p.cle ? "Utilisée ✓" : "Utiliser celle-ci"}
                    </button>
                  </li>
                ))}
              </ol>
              {choisie && (
                <Message type="ok">C'est dans le formulaire : tu peux encore tout modifier ci-dessous, et l'aperçu se met à jour.</Message>
              )}
              <details className="aide-redaction__conseils">
                <summary>Pour une annonce plus efficace</summary>
                <ul>
                  {resultat.conseils.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                  <li>Plus tu écris de mots utiles (matière, outil, lieu, moment), plus mes suggestions sont justes.</li>
                </ul>
              </details>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
