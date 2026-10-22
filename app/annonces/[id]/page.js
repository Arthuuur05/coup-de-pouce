import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";

export const metadata = { title: "Annonce · Coup de Pouce" };

export default function DetailAnnonce() {
  return (
    <EcranConnecte titre="Détail de l'annonce" onglet="annonces">
      <EtatVide titre="Bientôt ici">
        Le titre, la description, l'auteur et le bouton « Demander le contact » (lots 4 et 5).
      </EtatVide>
    </EcranConnecte>
  );
}
