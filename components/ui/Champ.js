export default function Champ({ id, label, erreur, ...props }) {
  return (
    <div className={`champ${erreur ? " champ--erreur" : ""}`}>
      <label htmlFor={id} className="champ__label">
        {label}
      </label>
      <input
        id={id}
        className="champ__input"
        aria-invalid={erreur ? "true" : undefined}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        {...props}
      />
      {erreur && (
        <span id={`${id}-erreur`} className="champ__erreur">
          {erreur}
        </span>
      )}
    </div>
  );
}
