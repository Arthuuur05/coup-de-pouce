import { NextResponse } from "next/server";
import { creerClient } from "../../../lib/supabase/server";

// Le lien reçu par e-mail arrive ici : on ouvre la session puis on continue vers l'appli.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const suite = searchParams.get("suite") ?? "/annonces";
  const destination = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/annonces";

  const supabase = await creerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  let error = { message: "lien incomplet" };
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));

  if (error) return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
  return NextResponse.redirect(`${origin}${destination}`);
}
