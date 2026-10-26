"use server";

import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { MESSAGE_MAX } from "../messages";

function messageBase(error) {
  const m = error?.message ?? "";
  if (m.includes("trop_de_messages")) return "Tu as envoyé beaucoup de messages. Réessaie dans un moment.";
  if (error?.code === "42501") return "Cette conversation est fermée : l'accord a été retiré.";
  return "Le message n'a pas pu être envoyé. Réessaie dans un instant.";
}

// Envoyer un message dans la conversation d'une demande acceptée. demandeId est attaché avec bind.
export async function envoyerMessage(demandeId, _etat, formData) {
  const texte = String(formData.get("texte") ?? "").trim();
  if (!texte) return { texte: "", erreur: "Écris un message avant d'envoyer." };
  if (texte.length > MESSAGE_MAX) return { texte, erreur: `${MESSAGE_MAX} caractères maximum.` };
  const supabase = await creerClient();
  const { error } = await supabase.from("messages").insert({ demande: demandeId, texte });
  if (error) return { texte, erreur: messageBase(error) };
  revalidatePath(`/messages/${demandeId}`);
  revalidatePath("/messages");
  return { texte: "", envoye: Date.now() };
}
