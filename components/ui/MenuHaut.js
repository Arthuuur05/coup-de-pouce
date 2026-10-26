import Link from "next/link";
import Initiale from "./Initiale";
import { IconePlus } from "./Icones";
import LienCloche from "./LienCloche";

const ONGLETS = [
  ["annonces", "/annonces", "Annonces"],
  ["meteo", "/meteo", "Météo du campus"],
  ["demandes", "/demandes", "Demandes"],
  ["profil", "/profil", "Profil"],
];

// Menu des écrans connectés sur ordinateur (le téléphone garde le menu du bas).
export default function MenuHaut({ actif, prenom, photo, enAttente = 0, nonLues = 0 }) {
  return (
    <header className="menu-haut">
      <Link href="/annonces" className="logo">
        Coup de Pouce<span>.</span>
      </Link>
      <nav className="menu-haut__liens" aria-label="Menu principal">
        {ONGLETS.map(([nom, href, label]) => (
          <Link
            key={nom}
            href={href}
            className={`menu-haut__lien${actif === nom ? " menu-haut__lien--actif" : ""}`}
            aria-current={actif === nom ? "page" : undefined}
          >
            {label}
            {nom === "demandes" && enAttente > 0 && (
              <span className="pastille" aria-label={`${enAttente} à voir`}>
                {enAttente}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <Link href="/publier" className="bouton bouton--accent">
        <IconePlus width={18} height={18} /> Publier
      </Link>
      <LienCloche nonLues={nonLues} actif={actif === "notifications"} />
      <Link href="/profil" aria-label="Mon profil" className="menu-haut__profil">
        <Initiale prenom={prenom} photo={photo} />
      </Link>
    </header>
  );
}
