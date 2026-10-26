import Etiquette from "../ui/Etiquette";
import Bouton from "../ui/Bouton";
import { CLASSE_CATEGORIE } from "../../lib/annonces";

// Le top 3 des besoins. Avec action = true : « Je peux aider » mène aux annonces « Je cherche » de la catégorie,
// « Je propose » à l'écran de publication déjà réglé sur cette catégorie.
export default function Besoins({ besoins, action = true }) {
  if (!besoins.length) return null;
  return (
    <ol className="besoins">
      {besoins.map((b, i) => (
        <li key={b.categorie} className="besoin">
          <span className="besoin__rang" aria-hidden="true">
            {i + 1}
          </span>
          <div className="besoin__corps">
            <Etiquette couleur={CLASSE_CATEGORIE[b.categorie] ?? "autre"}>{b.categorie}</Etiquette>
            <span className="carte__date">
              {b.nombre} annonce{b.nombre > 1 ? "s" : ""} cette semaine
            </span>
            {action && (
              <div className="rangee">
                <Bouton href={`/annonces?type=cherche&categorie=${encodeURIComponent(b.categorie)}`} variante="accent">
                  Je peux aider
                </Bouton>
                <Bouton href={`/publier?type=propose&categorie=${encodeURIComponent(b.categorie)}`} variante="secondaire">
                  Je propose
                </Bouton>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
