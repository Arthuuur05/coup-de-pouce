import Link from "next/link";
import BandeauHaut from "../components/ui/BandeauHaut";
import Logo from "../components/ui/Logo";
import Message from "../components/ui/Message";
import Messages from "../components/accueil/Messages";

export default async function Accueil({ searchParams }) {
  const { compte } = await searchParams;
  return (
    <>
      <BandeauHaut>L'entraide entre étudiants du campus</BandeauHaut>
      <main id="contenu" className="page accueil" style={{ gap: 28, paddingBottom: 32 }}>
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
