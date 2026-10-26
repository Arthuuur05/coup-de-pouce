import { creerClient } from "../../../lib/supabase/server";
import { chargerRendezVous } from "../../../lib/donnees-calendrier";
import { evenementIcs } from "../../../lib/calendrier";

// Le rendez-vous d'une demande, à ajouter à l'agenda du téléphone (avec rappels la veille et une heure avant).
// La base ne renvoie que les rendez-vous des deux personnes de l'accord.
export async function GET(request) {
  const supabase = await creerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return new Response("Connecte-toi pour ajouter ce rendez-vous à ton agenda.", { status: 401 });
  const demande = new URL(request.url).searchParams.get("demande") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(demande)) return new Response("Rendez-vous introuvable.", { status: 404 });
  const rdv = await chargerRendezVous(demande);
  if (!rdv) return new Response("Rendez-vous introuvable.", { status: 404 });
  const corps = evenementIcs({
    id: rdv.demande,
    quand: rdv.quand,
    lieu: rdv.lieu,
    titre: rdv.titre,
    prenom: rdv.autreProfil?.prenom || "un étudiant",
  });
  return new Response(corps, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rendez-vous-coup-de-pouce.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
