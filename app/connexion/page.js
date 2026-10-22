import Link from "next/link";
import EcranAffiche from "../../components/compte/EcranAffiche";
import FormConnexion from "../../components/compte/FormConnexion";

export const metadata = { title: "Connexion · Coup de Pouce" };

export default async function Connexion({ searchParams }) {
  const { suite = "/annonces", erreur } = await searchParams;
  return (
    <EcranAffiche
      bandeau="Content de te revoir"
      titre="Connexion"
      manuscrit="re-salut"
      sousTitre="Retrouve les annonces du campus et tes demandes."
    >
      <h2 className="seulement-ordi">Me connecter</h2>
      <FormConnexion suite={suite} erreurLien={erreur === "lien"} />
      <p style={{ margin: 0 }}>
        Pas encore de compte ? <Link href="/inscription">Inscris-toi</Link>
      </p>
    </EcranAffiche>
  );
}
