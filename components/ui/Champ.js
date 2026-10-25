// options : liste de choix → menu déroulant. multiligne : zone de texte. compteur : « 12/60 » à droite du label.
export default function Champ({ id, label, erreur, options, aide, multiligne, compteur, ...props }) {
  const commun = {
    id,
    className: `champ__input${multiligne ? " champ__input--multiligne" : ""}`,
    "aria-invalid": erreur ? "true" : undefined,
    "aria-describedby": erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined,
    ...props,
  };
  return (
    <div className={`champ${erreur ? " champ--erreur" : ""}`}>
      <div className="champ__entete">
        <label htmlFor={id} className="champ__label">
          {label}
        </label>
        {compteur && <span className="champ__compteur">{compteur}</span>}
      </div>
      {options ? (
        <select {...commun}>
          <option value="">Choisir…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : multiligne ? (
        <textarea {...commun} />
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
