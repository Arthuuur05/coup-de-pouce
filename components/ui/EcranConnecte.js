import Link from "next/link";
import MenuBas from "./MenuBas";
import Initiale from "./Initiale";
import { profilConnecte } from "../../lib/profil";

// Gabarit commun aux écrans connectés : logo, initiale, titre, sous-titre, contenu, menu du bas.
export default async function EcranConnecte({ titre, sousTitre, onglet, children }) {
  const profil = await profilConnecte();
  return (
    <>
      <main className="page">
        <div className="entete">
          <Link href="/annonces" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
          <Link href="/profil" aria-label="Mon profil" style={{ textDecoration: "none" }}>
            <Initiale prenom={profil?.prenom} />
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
