import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Mon profil · Coup de Pouce" };

export default function Profil() {
  return (
    <EcranConnecte titre="Mon profil" onglet="profil">
      <EtatVide titre="Bientôt ici">
        Prénom, filière, compétences, CV, coordonnées privées, mes annonces et déconnexion (lots 3 et 6).
      </EtatVide>
    </EcranConnecte>
  );
}
