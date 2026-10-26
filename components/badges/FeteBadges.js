import Confettis from "../ui/Confettis";
import BoutonAction from "../ui/BoutonAction";
import { feterBadges } from "../../lib/actions/badges";

// Célébration d'un nouveau palier : confettis, les badges gagnés, et « Super ! » pour ne la voir qu'une fois.
export default function FeteBadges({ nouveaux, niveau }) {
  if (!nouveaux.length) return null;
  return (
    <section className="fete-badges carte carte--ombre-rouge" aria-live="polite">
      <Confettis nombre={24} />
      <h2 className="fete-badges__titre">
        {nouveaux.length > 1 ? `${nouveaux.length} nouveaux badges !` : "Nouveau badge !"}
      </h2>
      <ul className="fete-badges__liste">
        {nouveaux.map((b) => (
          <li key={b.cle} className="fete-badges__badge">
            <span className="fete-badges__emoji" aria-hidden="true">
              {b.emoji}
            </span>
            <strong>{b.titre}</strong>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0 }}>
        Tu es au niveau {niveau.index} : <strong>{niveau.nom}</strong>.
      </p>
      <form action={feterBadges}>
        {nouveaux.map((b) => (
          <input key={b.cle} type="hidden" name="badge" value={b.cle} />
        ))}
        <BoutonAction className="bouton bouton--accent" enCours="Un instant…">
          Super !
        </BoutonAction>
      </form>
    </section>
  );
}
