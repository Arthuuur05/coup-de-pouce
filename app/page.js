import Link from "next/link";
import BandeauHaut from "../components/ui/BandeauHaut";
import Logo, { MarqueLogo } from "../components/ui/Logo";
import Message from "../components/ui/Message";
import Messages from "../components/accueil/Messages";
import CarteAnnonce from "../components/ui/CarteAnnonce";

export default async function Accueil({ searchParams }) {
  const { compte } = await searchParams;
  return (
    <>
      <BandeauHaut>L'entraide entre étudiants du campus</BandeauHaut>
      <main id="contenu" className="accueil-split">
        <section className="accueil-gauche">
          <div className="entete">
            <Link href="/" aria-label="Coup de Pouce, accueil" style={{ textDecoration: "none" }}>
              <Logo grand />
            </Link>
            <Link href="/connexion" style={{ fontWeight: 700 }}>
              Connexion
            </Link>
          </div>

          {compte === "supprime" && <Message type="ok">Ton compte a bien été supprimé. À bientôt peut-être !</Message>}

          <Messages />
        </section>

        <aside className="accueil-affiche seulement-ordi" aria-hidden="true">
          <span className="accueil-affiche__pouce">
            <MarqueLogo taille={420} />
          </span>
          <div className="accueil-affiche__cartes">
            <CarteAnnonce index={0} type="propose" categorie="Photo" titre="Photos pour vos événements" auteur="Sam · M1" date="il y a 2 h" />
            <CarteAnnonce index={1} type="cherche" categorie="Covoit" titre="Trajet vers Lyon vendredi soir" auteur="Inès · L2" date="hier" />
            <CarteAnnonce index={2} type="propose" categorie="Cours et soutien" titre="Aide en stats avant les partiels" auteur="Léa · L3" date="lundi" />
          </div>
        </aside>
      </main>
      <footer className="pied">
        <span className="pied__esp">
          <img src="/esp.png" alt="ESP" width="56" height="56" />
        </span>
        <br />
        Coup de Pouce · <Link href="/donnees-personnelles">données personnelles</Link>
      </footer>
    </>
  );
}
