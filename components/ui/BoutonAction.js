"use client";

import { useFormStatus } from "react-dom";

// Bouton d'un formulaire relié à une action serveur : se grise pendant l'envoi (pas de double clic),
// et peut demander confirmation avant les gestes qu'on ne défait pas d'un clic.
export default function BoutonAction({ children, confirmer, enCours: libelleEnCours, className = "bouton", ...props }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending ? "true" : undefined}
      onClick={confirmer ? (e) => !window.confirm(confirmer) && e.preventDefault() : undefined}
      {...props}
    >
      {pending && libelleEnCours ? libelleEnCours : children}
    </button>
  );
}
