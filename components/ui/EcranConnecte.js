import Link from "next/link";
import MenuBas from "./MenuBas";
import MenuHaut from "./MenuHaut";
import Initiale from "./Initiale";
import { profilConnecte } from "../../lib/profil";

// Gabarit commun aux écrans connectés. Téléphone : en-tête + menu du bas. Ordinateur : menu en haut.
export default async function EcranConnecte({ titre, sousTitre, onglet, children }) {
  const profil = await profilConnecte();
  return (
    <>
      <MenuHaut actif={onglet} prenom={profil?.prenom} />
      <main className="page">
        <div className="entete seulement-telephone">
          <Link href="/annonces" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
          <Link href="/profil" aria-label="Mon profil" style={{ textDecoration: "none" }}>
            <Initiale prenom={profil?.prenom} />
          </Link>
        </div>
        <div className="titre-ecran">
          <h1>{titre}</h1>
          {sousTitre && <p className="sous-titre">{sousTitre}</p>}
        </div>
        {children}
      </main>
      <MenuBas actif={onglet} />
    </>
  );
}
