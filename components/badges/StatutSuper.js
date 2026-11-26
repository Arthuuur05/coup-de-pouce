// Le statut Super Coup de Pouce : un grand badge quand il est mérité, sinon les trois conditions et où l'on en est.
export default function StatutSuper({ badges, moi = true }) {
  const gagne = badges.super;
  return (
    <section className={`super${gagne ? " super--gagne" : ""}`} aria-label="Statut Super Coup de Pouce">
      <div className="super__tete">
        <span className="super__medaille" aria-hidden="true">
          <svg viewBox="0 0 64 72">
            <path d="M32 3 59 18.5v35L32 69 5 53.5v-35z" />
          </svg>
          <span>{gagne ? "🏅" : "🔒"}</span>
        </span>
        <div>
          <h3 className="super__titre">Super Coup de Pouce</h3>
          <p className="super__texte">
            {gagne
              ? moi
                ? "Bravo, ce statut est à toi ! Il est visible sur ton profil."
                : "Une personne fiable et généreuse, reconnue par le campus."
              : "Le statut des personnes les plus fiables du campus. Voici ce qu'il te reste à faire."}
          </p>
        </div>
      </div>
      <ul className="super__criteres">
        {badges.criteres.map((c) => (
          <li key={c.cle} className={`critere${c.ok ? " critere--ok" : ""}`}>
            <span className="critere__coche" aria-hidden="true">
              {c.ok ? "✓" : ""}
            </span>
            <div className="critere__corps">
              <span className="critere__texte">{c.texte}</span>
              <span className="carte__date">
                {c.actuel}
                <span className="visuellement-cache">{c.ok ? " : condition remplie" : " : pas encore remplie"}</span>
              </span>
              {!c.ok && (
                <span className="critere__barre" aria-hidden="true">
                  <span style={{ width: `${c.avancement}%` }} />
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
