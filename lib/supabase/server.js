import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase côté serveur (pages, actions). Seulement la clé publique : la clé secrète ne sert jamais ici.
export async function creerClient() {
  const magasin = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll: (liste) => {
        try {
          liste.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Appelé depuis une page : le proxy rafraîchit déjà la session.
        }
      },
    },
  });
}
