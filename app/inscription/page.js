import Link from "next/link";
import EcranAffiche from "../../components/compte/EcranAffiche";
import FormInscription from "../../components/compte/FormInscription";

export const metadata = { title: "Inscription · Coup de Pouce" };

export default function Inscription() {
  return (
    <EcranAffiche
      bandeau="Bienvenue sur Coup de Pouce"
      titre={
        <>
          Rejoins
          <br />
          le campus
        </>
      }
      manuscrit="bienvenue"
      sousTitre="Une minute, et tu peux proposer ou demander un coup de pouce."
    >
      <h2 className="seulement-ordi">Créer mon compte</h2>
      <FormInscription />
      <p style={{ margin: 0 }}>
        Déjà un compte ? <Link href="/connexion">Connecte-toi</Link>
      </p>
    </EcranAffiche>
  );
}
