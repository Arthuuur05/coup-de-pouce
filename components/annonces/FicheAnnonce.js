import Etiquette from "../ui/Etiquette";
import Initiale from "../ui/Initiale";
import Bouton from "../ui/Bouton";
import SupprimerAnnonce from "./SupprimerAnnonce";
import { marquerReglee, remettreEnLigne, supprimerAnnonce } from "../../lib/actions/annonces";
import { TYPES, estEnLigne, etatAnnonce, dateRelative, joursRestants } from "../../lib/annonces";

// La fiche d'une annonce : le texte à gauche, l'auteur et les actions à droite (en dessous sur téléphone).
// moi : la personne connectée est l'auteur → Modifier, C'est réglé, Supprimer.
export default function FicheAnnonce({ annonce, moi }) {
  const enLigne = estEnLigne(annonce);
  const etat = etatAnnonce(annonce);
  const auteur = annonce.auteurProfil ?? {};
  return (
    <div className="deux-colonnes deux-colonnes--annonce">
      <article className="carte carte--ombre-noire fiche-annonce">
        <div className="rangee">
          <Etiquette variante={annonce.type}>{TYPES[annonce.type]}</Etiquette>
          <Etiquette>{annonce.categorie}</Etiquette>
          {moi && <Etiquette variante={etat.variante}>{etat.texte}</Etiquette>}
        </div>
        <h2 className="fiche-annonce__titre">{annonce.titre}</h2>
        <p className="fiche-annonce__description">{annonce.description}</p>
        {(annonce.quand || annonce.contrepartie) && (
          <dl className="fiche-annonce__infos">
            {annonce.quand && (
              <div>
                <dt>Quand ?</dt>
                <dd>{annonce.quand}</dd>
              </div>
            )}
            {annonce.contrepartie && (
              <div>
                <dt>Contrepartie</dt>
                <dd>{annonce.contrepartie}</dd>
              </div>
            )}
          </dl>
        )}
        <p className="carte__date" style={{ margin: 0 }}>
          Publiée {dateRelative(annonce.cree_le)}
          {annonce.campus ? ` · campus ${annonce.campus}` : ""}
          {moi && enLigne ? ` · encore ${joursRestants(annonce.expire_le)} j en ligne` : ""}
        </p>
      </article>

      <aside className="fiche-annonce__cote">
        <div className="carte carte--ombre-rouge fiche-auteur">
          <Initiale prenom={auteur.prenom} />
          <div style={{ minWidth: 0 }}>
            <div className="fiche-auteur__nom">{moi ? "C'est ton annonce" : auteur.prenom || "Un étudiant"}</div>
            <div className="carte__date">
              {[auteur.filiere, auteur.annee, auteur.campus && `campus ${auteur.campus}`].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {moi ? (
          <div className="fiche-annonce__actions">
            <Bouton href={`/annonces/${annonce.id}/modifier`} variante="principal">
              Modifier
            </Bouton>
            {enLigne ? (
              <form action={marquerReglee.bind(null, annonce.id)}>
                <button type="submit" className="bouton bouton--secondaire">
                  C'est réglé
                </button>
              </form>
            ) : (
              <form action={remettreEnLigne.bind(null, annonce.id)}>
                <button type="submit" className="bouton bouton--accent">
                  Remettre en ligne 30 jours
                </button>
              </form>
            )}
            <SupprimerAnnonce action={supprimerAnnonce.bind(null, annonce.id)} />
          </div>
        ) : (
          <div className="fiche-annonce__actions">
            <button type="button" className="bouton bouton--accent" disabled aria-describedby="contact-bientot">
              Demander le contact
            </button>
            <p id="contact-bientot" className="champ__aide" style={{ margin: 0 }}>
              Bientôt : {auteur.prenom || "l'auteur"} recevra ta demande et choisira de te montrer ses coordonnées.
            </p>
          </div>
        )}
        <Bouton href="/annonces" variante="secondaire">
          ← Toutes les annonces
        </Bouton>
      </aside>
    </div>
  );
}
