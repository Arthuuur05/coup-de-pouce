import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";
import EtatVide from "../../components/ui/EtatVide";

export const metadata = { title: "Inscription · Coup de Pouce" };

export default function Inscription() {
  return (
    <>
      <BandeauHaut>Bienvenue sur Coup de Pouce</BandeauHaut>
      <main className="page">
        <Link href="/" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
        <h1>Inscription</h1>
        <EtatVide titre="Bientôt ici">Prénom, e-mail et mot de passe (lot 3).</EtatVide>
        <p>
          Déjà un compte ? <Link href="/connexion">Connecte-toi</Link>
        </p>
      </main>
    </>
  );
}
