"use client";

import { useState } from "react";
import Link from "next/link";
import MotManuscrit from "../ui/MotManuscrit";

const MESSAGES = [
  { titre: ["Qui peut", "t'aider", "aujourd'hui ?"], mot: ["donner,", "recevoir"], texte: "L'entraide entre étudiants de ton campus : tu proposes ce que tu sais faire, tu trouves ce dont tu as besoin." },
  { titre: ["Un coup", "de pouce,", "en une annonce."], texte: "Photo, vidéo, code, cours, coloc, covoiturage : quelqu'un du campus sait déjà faire. Il suffit de demander." },
  { titre: ["Tes contacts", "restent", "à toi."], texte: "Tes coordonnées ne s'affichent qu'après ton accord. Jamais avant." },
];

// L'accueil, un message à la fois : on avance avec « Suivant », le dernier écran propose de créer son compte.
export default function Messages() {
  const [i, setI] = useState(0);
  const m = MESSAGES[i];
  const dernier = i === MESSAGES.length - 1;
  return (
    <div className="messages">
      <div className="messages__scene" key={i} aria-live="polite">
        <div style={{ position: "relative", paddingTop: 8 }}>
          <h1>
            {m.titre.map((ligne, n) => (
              <span key={ligne} className="messages__ligne" style={{ "--n": n }}>
                {ligne}
              </span>
            ))}
          </h1>
          {m.mot && (
            <MotManuscrit style={{ position: "absolute", right: 0, top: 18 }}>
              {m.mot[0]}
              <br />
              {m.mot[1]}
            </MotManuscrit>
          )}
        </div>
        <p className="messages__texte">{m.texte}</p>
      </div>

      <div className="messages__points" aria-hidden="true">
        {MESSAGES.map((_, n) => (
          <span key={n} className={`messages__point${n === i ? " messages__point--actif" : ""}`} />
        ))}
      </div>

      {dernier ? (
        <div className="rangee">
          <Link href="/inscription" className="bouton bouton--accent">
            Créer mon compte
          </Link>
          <Link href="/connexion" className="bouton bouton--secondaire">
            J'ai déjà un compte
          </Link>
        </div>
      ) : (
        <div className="rangee">
          <button type="button" className="bouton bouton--accent" onClick={() => setI(i + 1)}>
            Suivant →
          </button>
          <button type="button" className="bouton bouton--secondaire" onClick={() => setI(MESSAGES.length - 1)}>
            Passer
          </button>
        </div>
      )}
    </div>
  );
}
