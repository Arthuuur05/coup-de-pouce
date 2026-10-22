import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Annonces · Coup de Pouce" };

export default function Annonces() {
  return (
    <EcranConnecte titre="Annonces" sousTitre="Ce que le campus propose et cherche." onglet="annonces">
      <EtatVide titre="Bientôt ici">Le fil d'annonces, les filtres Je propose / Je cherche et la recherche (lot 4).</EtatVide>
    </EcranConnecte>
  );
}
