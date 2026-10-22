import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";

export const metadata = { title: "Relecture météo · Coup de Pouce" };

export default function RelectureMeteo() {
  return (
    <EcranConnecte titre="Relecture météo" sousTitre="Réservé à l'administratrice." onglet="meteo">
      <EtatVide titre="Bientôt ici">Le bulletin proposé par l'IA, à modifier, régénérer ou publier (lot 7).</EtatVide>
    </EcranConnecte>
  );
}
