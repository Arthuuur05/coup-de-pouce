// Le niveau d'une personne et sa barre vers le suivant.
export default function Niveau({ niveau }) {
  return (
    <div className="niveau">
      <div className="niveau__ligne">
        <strong className="niveau__nom">
          Niveau {niveau.index} · {niveau.nom}
        </strong>
        <span className="carte__date">{niveau.points} pts</span>
      </div>
      <div
        className="niveau__barre"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={niveau.avancement}
        aria-label="Avancement vers le niveau suivant"
      >
        <span className="niveau__rempli" style={{ width: `${niveau.avancement}%` }} />
      </div>
      <p className="champ__aide" style={{ margin: 0 }}>
        {niveau.suivant
          ? `Encore ${niveau.manque} pt${niveau.manque > 1 ? "s" : ""} pour « ${niveau.suivant} ».`
          : "Niveau maximum atteint, bravo !"}
      </p>
    </div>
  );
}
