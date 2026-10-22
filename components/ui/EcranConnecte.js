import Link from "next/link";
import MenuBas from "./MenuBas";

// Gabarit commun aux écrans connectés : logo, titre, sous-titre, contenu, menu du bas.
export default function EcranConnecte({ titre, sousTitre, onglet, children }) {
  return (
    <>
      <main className="page">
        <div className="entete">
          <Link href="/annonces" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
        </div>
        <h1>{titre}</h1>
        {sousTitre && <p className="sous-titre">{sousTitre}</p>}
        {children}
      </main>
      <MenuBas actif={onglet} />
    </>
  );
}
