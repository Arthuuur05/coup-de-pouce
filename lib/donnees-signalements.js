import { cache } from "react";
import { creerClient } from "./supabase/server";

// La file de l'admin (la base refuse tout autre que l'admin).
export async function chargerFileSignalements() {
  const supabase = await creerClient();
  const { data, error } = await supabase.rpc("file_signalements");
  return { signalements: data ?? [], erreur: Boolean(error) };
}

// Pastille de l'admin : signalements ouverts (0 pour tout le monde sauf l'admin). cache : une lecture par page.
export const compterSignalementsOuverts = cache(async () => {
  const supabase = await creerClient();
  const { data } = await supabase.rpc("signalements_ouverts");
  return data ?? 0;
});
