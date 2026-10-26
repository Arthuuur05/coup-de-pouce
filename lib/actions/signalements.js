"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { MOTIFS, DETAIL_MAX } from "../signalements";

function messageBase(error) {
  const m = error?.message ?? "";
  if (error?.code === "23505") return "Tu as déjà signalé ceci. Merci, on s'en occupe.";
  if (m.includes("signalement_de_soi")) return "Tu ne peux pas te signaler toi-même.";
  if (m.includes("trop_de_signalements")) return "Tu as déjà fait beaucoup de signalements aujourd'hui. Réessaie demain.";
  return "Un problème est survenu. Réessaie dans un instant.";
}

// Signaler une annonce (cible = "annonce") ou un profil (cible = "profil"). Le formulaire est relié avec bind.
export async function signaler(cible, id, _etat, formData) {
  const motif = String(formData.get("motif") ?? "");
  const detail = String(formData.get("detail") ?? "").trim();
  if (!MOTIFS[motif]) return { motif, detail, erreur: "Choisis un motif." };
  if (detail.length > DETAIL_MAX) return { motif, detail, erreur: `${DETAIL_MAX} caractères maximum.` };
  const supabase = await creerClient();
  const { error } = await supabase.from("signalements").insert({ [cible]: id, motif, detail });
  if (error) return { motif, detail, erreur: messageBase(error) };
  return { envoye: true };
}

// Seule l'admin entre ici (la base refuse de toute façon les autres).
async function admin() {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/connexion?suite=/admin/signalements");
  const { data: estAdmin } = await supabase.rpc("est_admin");
  if (!estAdmin) redirect("/annonces");
  return supabase;
}

export async function traiterSignalement(id, statut) {
  const supabase = await admin();
  if (!["traite", "classe", "ouvert"].includes(statut)) redirect("/admin/signalements?erreur=1");
  const { error } = await supabase.from("signalements").update({ statut }).eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/admin/signalements${error ? "?erreur=1" : ""}`);
}

export async function retirerAnnonce(id) {
  const supabase = await admin();
  const { error } = await supabase.rpc("retirer_annonce_signalee", { signalement: id });
  revalidatePath("/", "layout");
  redirect(`/admin/signalements${error ? "?erreur=1" : "?ok=retiree"}`);
}
