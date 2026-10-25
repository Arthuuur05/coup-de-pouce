"use client";

import { useState } from "react";

// Supprimer en deux temps : un premier clic demande confirmation.
export default function SupprimerAnnonce({ action }) {
  const [confirmer, setConfirmer] = useState(false);
  if (!confirmer) {
    return (
      <button type="button" className="bouton bouton--danger" onClick={() => setConfirmer(true)}>
        Supprimer
      </button>
    );
  }
  return (
    <form action={action} className="zone-danger confirmer-suppression">
      <p style={{ margin: 0, fontWeight: 700 }}>Supprimer cette annonce pour de bon ?</p>
      <div className="rangee">
        <button type="submit" className="bouton bouton--danger">
          Oui, supprimer
        </button>
        <button type="button" className="bouton bouton--secondaire" onClick={() => setConfirmer(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
