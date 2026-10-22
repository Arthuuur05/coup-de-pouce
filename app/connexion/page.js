import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";
import MotManuscrit from "../../components/ui/MotManuscrit";
import FormConnexion from "../../components/compte/FormConnexion";

export const metadata = { title: "Connexion · Coup de Pouce" };

export default async function Connexion({ searchParams }) {
  const { suite = "/annonces", erreur } = await searchParams;
  return (
    <>
      <BandeauHaut>Content de te revoir</BandeauHaut>
      <main className="page" style={{ paddingBottom: 40 }}>
        <Link href="/" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
        <div style={{ position: "relative", paddingTop: 12, marginBottom: 8 }}>
          <h1>Connexion</h1>
          <MotManuscrit style={{ position: "absolute", right: -4, top: -8, fontSize: 36 }}>re-salut</MotManuscrit>
        </div>
        <FormConnexion suite={suite} erreurLien={erreur === "lien"} />
        <p style={{ margin: 0 }}>
          Pas encore de compte ? <Link href="/inscription">Inscris-toi</Link>
        </p>
      </main>
    </>
  );
}
