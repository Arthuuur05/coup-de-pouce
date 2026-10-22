import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Connexion · Coup de Pouce" };

export default function Connexion() {
  return (
    <>
      <BandeauHaut>Content de te revoir</BandeauHaut>
      <main className="page">
        <Link href="/" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
        <h1>Connexion</h1>
        <EtatVide titre="Bientôt ici">E-mail, mot de passe et « mot de passe oublié » (lot 3).</EtatVide>
        <p>
          Pas encore de compte ? <Link href="/inscription">Inscris-toi</Link>
        </p>
      </main>
    </>
  );
}
