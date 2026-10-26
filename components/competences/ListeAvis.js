import Link from "next/link";
import Etoiles from "./Etoiles";
import Initiale from "../ui/Initiale";
import { supprimerAvis } from "../../lib/actions/competences";
import { dateRelative } from "../../lib/annonces";
import { texteAvis } from "../../lib/competences";

// Les avis reçus : moyenne en tête, puis les plus récents. Mes propres avis ont un bouton pour les retirer.
export default function ListeAvis({ resume, moiId, suite, vide }) {
  if (!resume.total) return <p className="carte__date" style={{ margin: 0 }}>{vide}</p>;
  return (
    <div className="avis">
      <div className="avis__resume">
        <span className="avis__moyenne">{String(resume.moyenne).replace(".", ",")}</span>
        <span>
          <Etoiles note={resume.moyenne} taille={20} />
          <span className="carte__date" style={{ display: "block" }}>
            sur {texteAvis(resume.total)}
          </span>
        </span>
      </div>
      <ul className="avis__liste">
        {resume.avis.map((a) => (
          <li key={a.id} className="avis__item">
            <div className="avis__haut">
              <Link href={`/etudiants/${a.auteur}`} className="carte__auteur" style={{ textDecoration: "none" }}>
                <Initiale prenom={a.auteurProfil?.prenom} photo={a.auteurProfil?.photoUrl} petite />
                {a.auteurProfil?.prenom || "Un étudiant"}
              </Link>
              <Etoiles note={a.note} taille={14} />
            </div>
            {a.commentaire && <p className="avis__texte">{a.commentaire}</p>}
            <div className="carte__date">
              {a.competenceNom && <strong className="avis__competence">✓ {a.competenceNom}</strong>} {dateRelative(a.cree_le)}
            </div>
            {a.auteur === moiId && (
              <form action={supprimerAvis.bind(null, a.id, suite)}>
                <button type="submit" className="avis__retirer">
                  Retirer mon avis
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
