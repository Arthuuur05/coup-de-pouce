import { cache } from "react";
import { creerClient } from "./supabase/server";
import { profilsVisibles } from "./donnees-annonces";

// Nombre de messages non lus (pastille). cache : une seule lecture par page.
export const compterMessagesNonLus = cache(async () => {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return 0;
  const { data: nombre } = await supabase.rpc("messages_non_lus");
  return nombre ?? 0;
});

// Mes conversations (une par demande acceptée), avec la personne en face.
export async function chargerMesConversations() {
  const supabase = await creerClient();
  const { data } = await supabase.rpc("mes_conversations");
  const liste = data ?? [];
  const profils = await profilsVisibles([...new Set(liste.map((c) => c.autre))]);
  return liste.map((c) => ({ ...c, autreProfil: profils[c.autre] }));
}

// Une conversation : la demande (acceptée, dont je fais partie), l'autre personne et les messages.
// Ouvrir la conversation marque les messages reçus et la notification comme lus.
export async function chargerConversation(demandeId, moiId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(demandeId))) return null;
  const supabase = await creerClient();
  const { data: demande } = await supabase
    .from("demandes")
    .select("id, annonce, demandeur, auteur, statut")
    .eq("id", demandeId)
    .maybeSingle();
  if (!demande || demande.statut !== "acceptee") return null;
  const autreId = demande.auteur === moiId ? demande.demandeur : demande.auteur;
  const maintenant = new Date().toISOString();
  await Promise.all([
    supabase.from("messages").update({ lu_le: maintenant }).eq("demande", demandeId).neq("auteur", moiId).is("lu_le", null),
    supabase.from("notifications").update({ lue_le: maintenant }).eq("demande", demandeId).eq("type", "message_recu").is("lue_le", null),
  ]);
  const [{ data: messages }, { data: annonce }, profils] = await Promise.all([
    supabase.from("messages").select("id, auteur, texte, cree_le").eq("demande", demandeId).order("cree_le").limit(200),
    supabase.rpc("mes_conversations").then(({ data }) => ({ data: (data ?? []).find((c) => c.demande === demandeId) })),
    profilsVisibles([autreId]),
  ]);
  return { demande, autreId, autre: profils[autreId], titre: annonce?.titre ?? "", messages: messages ?? [] };
}
