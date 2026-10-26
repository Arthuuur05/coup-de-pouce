"use server";

import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";
import { BADGES } from "../badges";

// « Super ! » : les badges fêtés ne sont plus célébrés. La base ne laisse écrire que mes lignes.
export async function feterBadges(formData) {
  const cles = formData.getAll("badge").map(String).filter((c) => BADGES.some((b) => b.cle === c));
  if (!cles.length) return;
  const supabase = await creerClient();
  await supabase.from("badges_vus").upsert(cles.map((badge) => ({ badge })), { onConflict: "personne,badge", ignoreDuplicates: true });
  revalidatePath("/profil");
}
