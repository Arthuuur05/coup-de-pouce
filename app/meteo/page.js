import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import BandeauMeteo from "../../components/ui/BandeauMeteo";

export const metadata = { title: "Météo du campus · Coup de Pouce" };

export default function Meteo() {
  return (
    <EcranConnecte titre="Météo du campus" sousTitre="Ce dont le campus a besoin cette semaine." onglet="meteo">
      <BandeauMeteo>Premier bulletin bientôt</BandeauMeteo>
      <EtatVide titre="Bientôt ici">Le bulletin de la semaine, le top 3 des besoins et le bouton « Je peux aider » (lot 7).</EtatVide>
    </EcranConnecte>
  );
}
