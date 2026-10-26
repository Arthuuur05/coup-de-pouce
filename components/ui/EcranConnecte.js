import Link from "next/link";
import MenuBas from "./MenuBas";
import MenuHaut from "./MenuHaut";
import Initiale from "./Initiale";
import { profilConnecte } from "../../lib/profil";
import { adresseMaPhoto } from "../../lib/donnees-annonces";

// Gabarit commun aux écrans connectés. Téléphone : en-tête + menu du bas. Ordinateur : menu en haut.
export default async function EcranConnecte({ titre, sousTitre, onglet, children }) {
  const profil = await profilConnecte();
  const photo = await adresseMaPhoto(profil?.photo);
  return (
    <>
      <MenuHaut actif={onglet} prenom={profil?.prenom} photo={photo} />
      <main className="page">
        <div className="entete seulement-telephone">
          <Link href="/annonces" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
          <Link href="/profil" aria-label="Mon profil" style={{ textDecoration: "none" }}>
            <Initiale prenom={profil?.prenom} photo={photo} />
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
