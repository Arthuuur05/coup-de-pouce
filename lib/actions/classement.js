"use server";

import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";

// Apparaître (ou non) dans le classement du campus. La base ne laisse modifier que mon profil.
export async function reglerClassement(formData) {
  const visible = formData.get("classement") === "on";
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return;
  await supabase.from("profils").update({ classement: visible }).eq("id", data.claims.sub);
  revalidatePath("/classement");
  revalidatePath("/profil");
}
