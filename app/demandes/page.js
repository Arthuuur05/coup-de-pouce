import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Demandes · Coup de Pouce" };

export default function Demandes() {
  return (
    <EcranConnecte titre="Demandes" sousTitre="Reçues et envoyées." onglet="demandes">
      <EtatVide titre="Bientôt ici">Accepter ou refuser une demande, voir les coordonnées après accord (lot 5).</EtatVide>
    </EcranConnecte>
  );
}
