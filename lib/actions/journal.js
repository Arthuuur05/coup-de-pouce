"use server";

import { creerClient } from "../supabase/server";
import { journaliser } from "../journal";

// Appelée par l'écran d'erreur (app/error.js) pour garder une trace d'un écran qui a planté.
export async function signalerErreur(message, chemin) {
  const supabase = await creerClient();
  await journaliser(supabase, "erreur", "écran", String(message ?? "Erreur inconnue"), String(chemin ?? ""));
}
