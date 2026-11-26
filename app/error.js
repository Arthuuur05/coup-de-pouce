"use client";

import { useEffect } from "react";
import Link from "next/link";
import { signalerErreur } from "../lib/actions/journal";

// Si un écran plante : un message clair et deux façons de s'en sortir, pas la page d'erreur par défaut.
export default function Erreur({ error, reset }) {
  useEffect(() => {
    signalerErreur(error?.message || error?.digest, window.location.pathname).catch(() => {});
  }, [error]);
  return (
    <main id="contenu" className="page page--texte">
      <h1>Oups</h1>
      <p className="sous-titre">Quelque chose s'est mal passé de notre côté. Ce n'est pas de ta faute.</p>
      <div className="rangee">
        <button type="button" className="bouton bouton--principal" onClick={() => reset()}>
          Réessayer
        </button>
        <Link href="/annonces" className="bouton bouton--secondaire">
          Voir les annonces
        </Link>
      </div>
    </main>
  );
}
