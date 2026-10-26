import { BADGES } from "../../lib/badges";

// Les badges : gagnés en couleur, à gagner en grisé (avec la façon de les obtenir) quand on regarde les siens.
export default function ListeBadges({ gagnes, montrerRestants }) {
  const cles = new Set(gagnes.map((b) => b.cle));
  const liste = montrerRestants ? BADGES : gagnes;
  if (!liste.length) return null;
  return (
    <ul className="badges">
      {liste.map((b) => (
        <li key={b.cle} className={`badge${cles.has(b.cle) ? "" : " badge--verrouille"}`}>
          <span className="badge__emoji" aria-hidden="true">
            {b.emoji}
          </span>
          <span>
            <strong className="badge__titre">{b.titre}</strong>
            <span className="badge__texte">{b.texte}</span>
            {!cles.has(b.cle) && <span className="visuellement-cache"> (pas encore obtenu)</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
