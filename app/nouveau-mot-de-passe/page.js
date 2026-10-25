import EcranAffiche from "../../components/compte/EcranAffiche";
import FormNouveauMotDePasse from "../../components/compte/FormNouveauMotDePasse";

export const metadata = { title: "Nouveau mot de passe · Coup de Pouce" };

// On arrive ici par le lien de l'e-mail « mot de passe oublié » : la session est déjà ouverte.
export default function NouveauMotDePasse() {
  return (
    <EcranAffiche
      bandeau="Dernière étape"
      titre={
        <>
          Nouveau
          <br />
          mot de passe
        </>
      }
      manuscrit="c'est reparti"
      sousTitre="Choisis-en un que tu retiendras. Tu arriveras ensuite sur les annonces."
    >
      <h2 className="seulement-ordi">Choisir mon mot de passe</h2>
      <FormNouveauMotDePasse />
    </EcranAffiche>
  );
}
