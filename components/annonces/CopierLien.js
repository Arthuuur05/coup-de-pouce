"use client";

import { useState } from "react";
import { IconeLien } from "../ui/Icones";

// Copie l'adresse de la page. Le lien ne s'ouvre que pour un étudiant connecté.
export default function CopierLien() {
  const [copie, setCopie] = useState(false);
  async function copier() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt("Copie ce lien :", window.location.href.split("?")[0]);
    }
  }
  return (
    <button type="button" className="bouton bouton--secondaire" onClick={copier} aria-live="polite">
      <IconeLien width={18} height={18} /> {copie ? "Lien copié" : "Copier le lien"}
    </button>
  );
}
