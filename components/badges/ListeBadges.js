import { BADGES } from "../../lib/badges";

// Les teintes : aide en rouge, publication en noir, confiance en vert.
const TEINTES = {
  "premier-coup": "rouge", "coups-5": "rouge", "coups-10": "rouge", "coups-25": "rouge",
  "premiere-annonce": "noir", "profil-complet": "noir",
  "premier-avis": "vert", "avis-5": "vert", "cinq-etoiles": "vert",
};

// Une médaille hexagonale, dans l'esprit des badges Airbnb : formes douces, couleur franche, ombre légère.
export function Medaille({ emoji, teinte = "rouge", verrouille = false, grande = false }) {
  return (
    <span className={`medaille medaille--${verrouille ? "verrouillee" : teinte}${grande ? " medaille--grande" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 72" className="medaille__forme">
        <path d="M32 3 59 18.5v35L32 69 5 53.5v-35z" />
      </svg>
      <span className="medaille__emoji">{verrouille ? "🔒" : emoji}</span>
    </span>
  );
}

// Les badges : gagnés en couleur, à gagner en grisé (avec la façon de les obtenir) quand on regarde les siens.
export default function ListeBadges({ gagnes, montrerRestants }) {
  const cles = new Set(gagnes.map((b) => b.cle));
  const liste = montrerRestants ? BADGES : gagnes;
  if (!liste.length) return null;
  return (
    <ul className="badges">
      {liste.map((b) => {
        const gagne = cles.has(b.cle);
        return (
          <li key={b.cle} className={`badge${gagne ? "" : " badge--verrouille"}`}>
            <Medaille emoji={b.emoji} teinte={TEINTES[b.cle]} verrouille={!gagne} />
            <strong className="badge__titre">{b.titre}</strong>
            <span className="badge__texte">{gagne ? b.texte : `À débloquer : ${b.texte.charAt(0).toLowerCase()}${b.texte.slice(1)}`}</span>
            {!gagne && <span className="visuellement-cache"> (pas encore obtenu)</span>}
          </li>
        );
      })}
    </ul>
  );
}
