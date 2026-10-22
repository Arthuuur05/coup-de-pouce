import Link from "next/link";
import { IconeSoleil, IconeBulle, IconeProfil, IconePlus } from "./Icones";

// actif : "annonces" | "meteo" | "publier" | "demandes" | "profil"
export default function MenuBas({ actif = "annonces" }) {
  const lien = (nom) => `menu-bas__lien${actif === nom ? " menu-bas__lien--actif" : ""}`;
  return (
    <nav className="menu-bas" aria-label="Menu principal">
      <Link href="/annonces" className={lien("annonces")} aria-current={actif === "annonces" ? "page" : undefined}>
        Annonces
      </Link>
      <Link href="/meteo" className={lien("meteo")} aria-label="Météo du campus">
        <IconeSoleil />
      </Link>
      <Link href="/publier" className="menu-bas__lien menu-bas__publier" aria-label="Publier une annonce">
        <IconePlus />
      </Link>
      <Link href="/demandes" className={lien("demandes")} aria-label="Demandes">
        <IconeBulle />
      </Link>
      <Link href="/profil" className={lien("profil")} aria-label="Mon profil">
        <IconeProfil />
      </Link>
    </nav>
  );
}
