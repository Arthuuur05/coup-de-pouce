// Écrit une ligne dans le journal du super admin. Ne plante jamais : si l'écriture échoue, on laisse tomber.
export async function journaliser(supabase, niveau, source, message, chemin = "") {
  try {
    await supabase.rpc("journaliser", {
      niveau,
      source,
      message: String(message?.message ?? message ?? "").slice(0, 500),
      chemin,
    });
  } catch {
    /* rien : le journal ne doit jamais casser l'appli */
  }
}
