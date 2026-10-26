// Les compétences d'une personne. Une coche et un nombre quand d'autres étudiants les ont confirmées.
import Link from "next/link";

// lien(c) : rend chaque compétence cliquable (filtre des avis) ; actif : l'id de la compétence choisie.
export default function ListeCompetences({ competences, vide, lien, actif }) {
  if (!competences.length) return <p className="carte__date" style={{ margin: 0 }}>{vide}</p>;
  return (
    <ul className="competences">
      {competences.map((c) => (
        <li key={c.id} className={`competence${c.validations ? " competence--validee" : ""}${actif === c.id ? " competence--choisie" : ""}`}>
          {lien ? (
            <Link href={lien(c)} className="competence__lien" aria-current={actif === c.id ? "true" : undefined}>
              {c.nom}
            </Link>
          ) : (
            c.nom
          )}
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
