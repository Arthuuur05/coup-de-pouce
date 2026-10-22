// options : liste de choix → menu déroulant au lieu d'une case de texte.
export default function Champ({ id, label, erreur, options, aide, ...props }) {
  const commun = {
    id,
    className: "champ__input",
    "aria-invalid": erreur ? "true" : undefined,
    "aria-describedby": erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined,
    ...props,
  };
  return (
    <div className={`champ${erreur ? " champ--erreur" : ""}`}>
      <label htmlFor={id} className="champ__label">
        {label}
      </label>
      {options ? (
        <select {...commun}>
          <option value="">Choisir…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input {...commun} />
      )}
      {aide && !erreur && (
        <span id={`${id}-aide`} className="champ__aide">
          {aide}
        </span>
      )}
      {erreur && (
        <span id={`${id}-erreur`} className="champ__erreur">
          {erreur}
        </span>
      )}
    </div>
  );
}
