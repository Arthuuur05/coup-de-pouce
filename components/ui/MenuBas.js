import Link from "next/link";
import { IconeSoleil, IconeBulle, IconeProfil, IconePlus, IconeMaison } from "./Icones";

// actif : "annonces" | "meteo" | "publier" | "demandes" | "profil". enAttente : pastille sur Demandes.
export default function MenuBas({ actif = "annonces", enAttente = 0 }) {
  const lien = (nom) => `menu-bas__lien${actif === nom ? " menu-bas__lien--actif" : ""}`;
  return (
    <nav className="menu-bas" aria-label="Menu principal">
      <Link href="/annonces" className={lien("annonces")} aria-label="Annonces">
        {actif === "annonces" ? "Annonces" : <IconeMaison />}
      </Link>
      <Link href="/meteo" className={lien("meteo")} aria-label="Météo du campus">
        <IconeSoleil />
      </Link>
      <Link href="/publier" className="menu-bas__lien menu-bas__publier" aria-label="Publier une annonce">
        <IconePlus />
      </Link>
      <Link
        href="/demandes"
        className={`${lien("demandes")} menu-bas__demandes`}
        aria-label={enAttente ? `Demandes, ${enAttente} en attente` : "Demandes"}
      >
        <IconeBulle />
        {enAttente > 0 && <span className="pastille" aria-hidden="true">{enAttente}</span>}
      </Link>
      <Link href="/profil" className={lien("profil")} aria-label="Mon profil">
        <IconeProfil />
      </Link>
    </nav>
  );
}
