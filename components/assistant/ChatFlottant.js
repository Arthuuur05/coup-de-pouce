"use client";

import { useState, useEffect } from "react";
import Assistant from "./Assistant";
import { IconeBulle } from "../ui/Icones";

// Le chatbot : un bouton rond en bas à droite de tous les écrans connectés, qui ouvre l'assistant dans une fenêtre.
export default function ChatFlottant() {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    const fermerAvecEchap = (evt) => evt.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", fermerAvecEchap);
    return () => window.removeEventListener("keydown", fermerAvecEchap);
  }, [ouvert]);

  return (
    <div className="chat">
      {ouvert && (
        <section className="chat__fenetre" role="dialog" aria-label="Assistant Coup de Pouce">
          <header className="chat__entete">
            <div>
              <strong className="chat__titre">Coup de Pouce Bot</strong>
              <span className="chat__sous-titre">Je cherche dans les annonces pour toi</span>
            </div>
            <button type="button" className="chat__fermer" onClick={() => setOuvert(false)} aria-label="Fermer l'assistant">
              ×
            </button>
          </header>
          <div className="chat__corps">
            <Assistant />
          </div>
          <p className="chat__note">Un assistant simple, pas une IA : il reconnaît des mots-clés. Rien n'est enregistré.</p>
        </section>
      )}
      <button
        type="button"
        className="chat__bouton"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        {ouvert ? "×" : <IconeBulle width={28} height={28} />}
      </button>
    </div>
  );
}
