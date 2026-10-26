// Les compétences d'une personne. Une coche et un nombre quand d'autres étudiants les ont confirmées.
export default function ListeCompetences({ competences, vide }) {
  if (!competences.length) return <p className="carte__date" style={{ margin: 0 }}>{vide}</p>;
  return (
    <ul className="competences">
      {competences.map((c) => (
        <li key={c.id} className={`competence${c.validations ? " competence--validee" : ""}`}>
          {c.nom}
          {c.validations > 0 && (
            <span className="competence__valid" title={`Confirmée par ${c.validations} étudiant${c.validations > 1 ? "s" : ""}`}>
              ✓ {c.validations}
              <span className="visuellement-cache"> confirmation{c.validations > 1 ? "s" : ""}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
