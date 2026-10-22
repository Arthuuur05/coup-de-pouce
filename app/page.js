import BandeauHaut from "../components/ui/BandeauHaut";
import MotManuscrit from "../components/ui/MotManuscrit";
import Bouton from "../components/ui/Bouton";

export default function Accueil() {
  return (
    <>
      <BandeauHaut>Bientôt sur ton campus</BandeauHaut>
      <main className="page">
        <div style={{ fontFamily: "var(--font-titre)", fontWeight: 800, fontSize: 24 }}>
          COUP DE POUCE<span style={{ color: "var(--rouge)" }}>.</span>
        </div>
        <div style={{ position: "relative", paddingTop: 8 }}>
          <h1>
            Qui peut
            <br />
            t'aider
            <br />
            aujourd'hui ?
          </h1>
          <MotManuscrit style={{ position: "absolute", right: 0, top: 18 }}>
            donner,
            <br />
            recevoir
          </MotManuscrit>
        </div>
        <p>L'appli d'entraide entre étudiants : tu proposes ce que tu sais faire, tu trouves ce dont tu as besoin.</p>
        <div className="rangee">
          <Bouton href="/design" variante="principal">
            Voir le design system →
          </Bouton>
        </div>
      </main>
    </>
  );
}
