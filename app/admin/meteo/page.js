import { redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import { profilConnecte } from "../../../lib/profil";

export const metadata = { title: "Relecture météo · Coup de Pouce" };

export default async function RelectureMeteo() {
  const profil = await profilConnecte();
  if (!profil?.est_admin) redirect("/meteo");

  return (
    <EcranConnecte titre="Relecture météo" sousTitre="Réservé à l'administratrice." onglet="meteo">
      <EtatVide titre="Bientôt ici">Le bulletin proposé par l'IA, à modifier, régénérer ou publier (lot 7).</EtatVide>
    </EcranConnecte>
  );
}
