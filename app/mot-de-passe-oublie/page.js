import Link from "next/link";
import EcranAffiche from "../../components/compte/EcranAffiche";
import FormMotDePasseOublie from "../../components/compte/FormMotDePasseOublie";

export const metadata = { title: "Mot de passe oublié · Coup de Pouce" };

export default function MotDePasseOublie() {
  return (
    <EcranAffiche
      bandeau="Ça arrive à tout le monde"
      titre={
        <>
          Mot de passe
          <br />
          oublié ?
        </>
      }
      manuscrit="pas de panique"
      sousTitre="Donne l'e-mail de ton compte, on t'envoie un lien pour en choisir un nouveau."
    >
      <h2 className="seulement-ordi">Recevoir un lien</h2>
      <FormMotDePasseOublie />
      <p style={{ margin: 0 }}>
        Ça te revient ? <Link href="/connexion">Connecte-toi</Link>
      </p>
    </EcranAffiche>
  );
}
