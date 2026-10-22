import Link from "next/link";
import BandeauHaut from "../ui/BandeauHaut";
import MotManuscrit from "../ui/MotManuscrit";
import CarteAnnonce from "../ui/CarteAnnonce";

// Écrans Inscription / Connexion. Téléphone : une colonne. Ordinateur : affiche noire à gauche, formulaire à droite.
export default function EcranAffiche({ bandeau, titre, manuscrit, sousTitre, children }) {
  return (
    <>
      <BandeauHaut>{bandeau}</BandeauHaut>
      <div className="ecran-affiche">
        <aside className="ecran-affiche__affiche">
          <Link href="/" className="logo">
            Coup de Pouce<span>.</span>
          </Link>
          <div className="ecran-affiche__titre">
            <h1>{titre}</h1>
            <MotManuscrit>{manuscrit}</MotManuscrit>
          </div>
          {sousTitre && <p className="sous-titre">{sousTitre}</p>}
          <div className="ecran-affiche__exemples seulement-ordi" aria-hidden="true">
            <CarteAnnonce index={0} type="propose" categorie="Photo" titre="Photos pour vos événements" auteur="Sam · M1" date="il y a 2 h" />
            <CarteAnnonce index={1} type="cherche" categorie="Covoit" titre="Trajet vers Lyon vendredi soir" auteur="Léa · L3" date="hier" />
          </div>
        </aside>
        <main className="ecran-affiche__contenu">{children}</main>
      </div>
    </>
  );
}
