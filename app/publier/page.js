import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Publier · Coup de Pouce" };

export default function Publier() {
  return (
    <EcranConnecte titre="Publier une annonce" sousTitre="Tu proposes ou tu cherches ?" onglet="publier">
      <EtatVide titre="Bientôt ici">Le formulaire : type, catégorie, titre, description, disponibilités (lot 4).</EtatVide>
    </EcranConnecte>
  );
}
