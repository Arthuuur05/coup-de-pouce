import Link from "next/link";
import BandeauHaut from "../components/ui/BandeauHaut";
import MotManuscrit from "../components/ui/MotManuscrit";
import Bouton from "../components/ui/Bouton";
import CarteAnnonce from "../components/ui/CarteAnnonce";

const etapes = [
  ["Je publie", "Ce que je sais faire, ou ce que je cherche : photo, vidéo, cours, coloc, covoit…"],
  ["On me demande", "Quelqu'un du campus voit mon annonce et demande à être mis en relation."],
  ["J'accepte", "Mes coordonnées ne s'affichent qu'après mon accord. Jamais avant."],
];

export default function Accueil() {
  return (
    <>
      <BandeauHaut>L'entraide entre étudiants du campus</BandeauHaut>
      <main className="page" style={{ gap: 28, paddingBottom: 32 }}>
        <div className="entete">
          <Link href="/" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
          <Link href="/connexion" style={{ fontWeight: 700 }}>
            Connexion
          </Link>
        </div>

        <div className="accueil-hero">
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
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

            <p style={{ margin: 0, fontSize: 17 }}>
              Tu proposes ce que tu sais faire, tu trouves ce dont tu as besoin. Entre étudiants, sur ton campus.
            </p>

            <div className="rangee">
              <Bouton href="/inscription" variante="accent">
                Créer mon compte
              </Bouton>
              <Bouton href="/connexion" variante="secondaire">
                J'ai déjà un compte
              </Bouton>
            </div>
          </div>
          <div className="accueil-exemples seulement-ordi" aria-hidden="true">
            <CarteAnnonce index={0} type="propose" categorie="Photo" titre="Photos pour vos événements" auteur="Sam · M1" date="il y a 2 h" />
            <CarteAnnonce index={1} type="cherche" categorie="Covoit" titre="Trajet vers Lyon vendredi soir" auteur="Inès · L2" date="hier" />
            <CarteAnnonce index={2} type="propose" categorie="Cours et soutien" titre="Aide en stats avant les partiels" auteur="Léa · L3" date="lundi" />
          </div>
        </div>

        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2>Comment ça marche</h2>
          <ol className="etapes">
            {etapes.map(([titre, texte], i) => (
              <li key={titre} className="etape">
                <span className="etape__numero" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <div className="etape__titre">{titre}</div>
                  <p className="etape__texte">{texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="seulement-telephone" style={{ flexDirection: "column", gap: 14 }}>
          <h2>Par exemple</h2>
          <CarteAnnonce
            index={1}
            type="propose"
            categorie="Photo"
            titre="Photos pour vos événements"
            auteur="Sam · M1"
            date="il y a 2 h"
          />
        </section>

        <Bouton href="/inscription" variante="principal">
          Je me lance →
        </Bouton>
      </main>
      <footer className="pied">
        Coup de Pouce · projet étudiant · <Link href="/design">design system</Link>
      </footer>
    </>
  );
}
