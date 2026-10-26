"use server";

import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { parisVersDate, LIEU_MAX } from "../calendrier";

function messageBase(error) {
  const m = error?.message ?? "";
  if (m.includes("date_passee")) return "Choisis une date et une heure à venir.";
  if (m.includes("date_trop_lointaine")) return "Choisis une date dans l'année qui vient.";
  if (error?.code === "42501") return "L'accord a été retiré : le rendez-vous n'est plus possible.";
  return "Le rendez-vous n'a pas pu être enregistré. Réessaie dans un instant.";
}

function rafraichir() {
  revalidatePath("/demandes");
  revalidatePath("/calendrier");
  revalidatePath("/notifications");
}

// Fixer ou changer le rendez-vous d'une demande acceptée. demandeId est attaché avec bind.
export async function fixerRendezVous(demandeId, _etat, formData) {
  const saisie = { quand: String(formData.get("quand") ?? ""), lieu: String(formData.get("lieu") ?? "").trim() };
  const date = parisVersDate(saisie.quand);
  if (!date) return { ...saisie, erreur: "Choisis une date et une heure." };
  if (date.getTime() <= Date.now()) return { ...saisie, erreur: "Choisis une date et une heure à venir." };
  if (saisie.lieu.length > LIEU_MAX) return { ...saisie, erreur: `Le lieu est limité à ${LIEU_MAX} caractères.` };
  const supabase = await creerClient();
  const { data: existant } = await supabase.from("rendez_vous").select("id").eq("demande", demandeId).maybeSingle();
  const { error } = existant
    ? await supabase.from("rendez_vous").update({ quand: date.toISOString(), lieu: saisie.lieu }).eq("demande", demandeId)
    : await supabase.from("rendez_vous").insert({ demande: demandeId, quand: date.toISOString(), lieu: saisie.lieu });
  if (error) return { ...saisie, erreur: messageBase(error) };
  rafraichir();
  return { ...saisie, ok: existant ? "Rendez-vous modifié. L'autre personne est prévenue." : "Rendez-vous fixé. L'autre personne est prévenue." };
}

export async function annulerRendezVous(demandeId) {
  const supabase = await creerClient();
  await supabase.from("rendez_vous").delete().eq("demande", demandeId);
  rafraichir();
}
