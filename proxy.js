import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Écrans réservés aux personnes connectées.
const PROTEGES = ["/annonces", "/publier", "/demandes", "/meteo", "/profil", "/admin"];
// Écrans inutiles quand on est déjà connecté.
const INVITES = ["/connexion", "/inscription"];

const commencePar = (chemin, liste) => liste.some((p) => chemin === p || chemin.startsWith(`${p}/`));

export async function proxy(request) {
  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (liste) => {
          liste.forEach(({ name, value }) => request.cookies.set(name, value));
          reponse = NextResponse.next({ request });
          liste.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // Vérifie le jeton de session (et le rafraîchit au besoin).
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const versAutrePage = (chemin) => {
    const url = request.nextUrl.clone();
    url.pathname = chemin;
    url.search = "";
    if (chemin === "/connexion") url.searchParams.set("suite", pathname + search);
    const redirection = NextResponse.redirect(url);
    reponse.cookies.getAll().forEach((c) => redirection.cookies.set(c));
    return redirection;
  };

  if (!connecte && commencePar(pathname, PROTEGES)) return versAutrePage("/connexion");
  if (connecte && commencePar(pathname, INVITES)) return versAutrePage("/annonces");
  return reponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
