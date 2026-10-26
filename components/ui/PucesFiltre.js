import Link from "next/link";

// Une rangée de puces-filtres. options : [valeur, libellé, nombre?] ; lien(valeur) donne l'adresse de la puce.
export default function PucesFiltre({ options, actif, lien, nom }) {
  return (
    <nav className="filtres__puces" aria-label={nom}>
      {options.map(([valeur, libelle, nombre]) => (
        <Link
          key={valeur}
          href={lien(valeur)}
          scroll={false}
          className={`puce${actif === valeur ? " puce--active" : ""}`}
          aria-current={actif === valeur ? "true" : undefined}
        >
          {libelle}
          {nombre !== undefined && <span className="puce__nombre">{nombre}</span>}
        </Link>
      ))}
    </nav>
  );
}
