import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";
import MotManuscrit from "../../components/ui/MotManuscrit";
import FormInscription from "../../components/compte/FormInscription";

export const metadata = { title: "Inscription · Coup de Pouce" };

export default function Inscription() {
  return (
    <>
      <BandeauHaut>Bienvenue sur Coup de Pouce</BandeauHaut>
      <main className="page" style={{ paddingBottom: 40 }}>
        <Link href="/" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
        <div style={{ position: "relative" }}>
          <h1>
            Rejoins
            <br />
            le campus
          </h1>
          <MotManuscrit style={{ position: "absolute", right: -4, top: -18, fontSize: 38 }}>bienvenue</MotManuscrit>
        </div>
        <p className="sous-titre">Une minute, et tu peux proposer ou demander un coup de pouce.</p>
        <FormInscription />
        <p style={{ margin: 0 }}>
          Déjà un compte ? <Link href="/connexion">Connecte-toi</Link>
        </p>
      </main>
    </>
  );
}
