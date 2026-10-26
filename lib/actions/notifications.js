"use server";

import { revalidatePath } from "next/cache";
import { creerClient } from "../supabase/server";

// La base ne laisse modifier que lue_le, et seulement sur mes notifications.
export async function toutMarquerLu() {
  const supabase = await creerClient();
  await supabase.from("notifications").update({ lue_le: new Date().toISOString() }).is("lue_le", null);
  revalidatePath("/", "layout");
}

export async function toutEffacer() {
  const supabase = await creerClient();
  await supabase.from("notifications").delete().not("id", "is", null);
  revalidatePath("/", "layout");
}
