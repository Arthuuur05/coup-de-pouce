import Link from "next/link";
import Etiquette from "../ui/Etiquette";
import Initiale from "../ui/Initiale";
import Bouton from "../ui/Bouton";
import { IconeCoeur } from "../ui/Icones";
import SupprimerAnnonce from "./SupprimerAnnonce";
import CopierLien from "./CopierLien";
import FormDemande from "../demandes/FormDemande";
import Coordonnees from "../demandes/Coordonnees";
import { marquerReglee, remettreEnLigne, supprimerAnnonce, basculerFavori } from "../../lib/actions/annonces";
import { demanderContact, annulerDemande, repondreDemande } from "../../lib/actions/demandes";
import { texteBoutonContact } from "../../lib/demandes";
import { TYPES, CLASSE_CATEGORIE, estEnLigne, etatAnnonce, dateRelative, joursRestants } from "../../lib/annonces";

// La fiche d'une annonce : le texte à gauche, l'auteur et les actions à droite (en dessous sur téléphone).
// moi : la personne connectée est l'auteur → Modifier, C'est réglé, Supprimer, et les demandes reçues.
// Sinon : demander le contact (ou l'état de ma demande), favori.
export default function FicheAnnonce({ annonce, moi, favori = false, maDemande = {}, sansCoordonnees, demandesRecues }) {
  const enLigne = estEnLigne(annonce);
  const etat = etatAnnonce(annonce);
  const auteur = annonce.auteurProfil ?? {};
  const couleur = CLASSE_CATEGORIE[annonce.categorie] ?? "autre";
  const detailAuteur = [auteur.filiere, auteur.annee, auteur.campus && `campus ${auteur.campus}`].filter(Boolean).join(" · ");
  return (
    <div className="deux-colonnes deux-colonnes--annonce">
      <article className={`carte carte--ombre-noire fiche-annonce carte--categorie carte--${couleur}`}>
        {annonce.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={annonce.photoUrl} alt="" className="fiche-annonce__photo" />
        )}
        <div className="rangee">
          <Etiquette variante={annonce.type}>{TYPES[annonce.type]}</Etiquette>
          <Etiquette couleur={couleur}>{annonce.categorie}</Etiquette>
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
        {moi ? (
          <div className="carte carte--ombre-rouge fiche-auteur">
            <Initiale prenom={auteur.prenom} photo={auteur.photoUrl} />
            <div style={{ minWidth: 0 }}>
              <div className="fiche-auteur__nom">C'est ton annonce</div>
              <div className="carte__date">{detailAuteur}</div>
            </div>
          </div>
        ) : (
          <Link href={`/etudiants/${annonce.auteur}`} className="carte carte--ombre-rouge fiche-auteur fiche-auteur--lien">
            <Initiale prenom={auteur.prenom} photo={auteur.photoUrl} />
            <div style={{ minWidth: 0 }}>
              <div className="fiche-auteur__nom">{auteur.prenom || "Un étudiant"}</div>
              <div className="carte__date">{detailAuteur}</div>
              <div className="fiche-auteur__voir">Voir son profil →</div>
            </div>
          </Link>
        )}

        {moi && demandesRecues?.total > 0 && (
          <Link href="/demandes" className="carte demande-compte">
            <span className="demande-compte__nombre">{demandesRecues.total}</span>
            <span>
              {demandesRecues.total > 1 ? "demandes de contact" : "demande de contact"}
              {demandesRecues.enAttente > 0 && <strong> · {demandesRecues.enAttente} en attente</strong>}
              <span className="fiche-auteur__voir">Y répondre →</span>
            </span>
          </Link>
        )}

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
              <form action={remettreEnLigne.bind(null, annonce.id, "annonce")}>
                <button type="submit" className="bouton bouton--accent">
                  Remettre en ligne 30 jours
                </button>
              </form>
            )}
            <CopierLien />
            <SupprimerAnnonce action={supprimerAnnonce.bind(null, annonce.id)} />
          </div>
        ) : (
          <div className="fiche-annonce__actions">
            <Contact annonce={annonce} prenom={auteur.prenom} maDemande={maDemande} sansCoordonnees={sansCoordonnees} />
            <form action={basculerFavori.bind(null, annonce.id, favori)}>
              <button type="submit" className={`bouton bouton--secondaire${favori ? " bouton--favori" : ""}`} aria-pressed={favori}>
                <IconeCoeur plein={favori} width={18} height={18} /> {favori ? "Dans mes favoris" : "Ajouter aux favoris"}
              </button>
            </form>
            <CopierLien />
          </div>
        )}
        <Bouton href="/annonces" variante="secondaire">
          ← Toutes les annonces
        </Bouton>
      </aside>
    </div>
  );
}

// Le bloc « contact » d'une annonce qui n'est pas à moi, selon l'état de ma demande.
function Contact({ annonce, prenom, maDemande, sansCoordonnees }) {
  const { demande, coordonnees } = maDemande;
  const nom = prenom || "L'auteur";
  if (!demande) {
    return (
      <div className="carte carte--ombre-noire demande-bloc">
        <div className="demande-bloc__titre">{annonce.type === "cherche" ? "Tu peux aider ?" : "Ça t'intéresse ?"}</div>
        <p style={{ margin: 0 }}>
          {nom} reçoit ta demande avec ton message. En cas d'accord, vous verrez chacun les coordonnées de l'autre.
        </p>
        <FormDemande
          action={demanderContact.bind(null, annonce.id)}
          prenom={prenom}
          sansCoordonnees={sansCoordonnees}
          bouton={texteBoutonContact(annonce.type)}
        />
      </div>
    );
  }
  if (demande.statut === "acceptee") {
    return (
      <>
        <Coordonnees prenom={prenom} coordonnees={coordonnees} />
        <form action={repondreDemande.bind(null, demande.id, "retiree", true)}>
          <button type="submit" className="bouton bouton--danger">
            Ne plus partager mes coordonnées
          </button>
        </form>
      </>
    );
  }
  if (demande.statut === "en_attente") {
    return (
      <div className="carte carte--ombre-noire demande-bloc">
        <div className="rangee">
          <Etiquette variante="attente">Demande envoyée</Etiquette>
          <span className="carte__date">{dateRelative(demande.cree_le)}</span>
        </div>
        <p style={{ margin: 0 }}>{nom} va te répondre. Tu retrouves ta demande dans l'onglet Demandes.</p>
        {demande.message && <blockquote className="demande__message">{demande.message}</blockquote>}
        <form action={annulerDemande.bind(null, demande.id, `/annonces/${annonce.id}?demande=annulee`)}>
          <button type="submit" className="bouton bouton--secondaire">
            Annuler ma demande
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="carte carte--ombre-noire demande-bloc">
      <p style={{ margin: 0 }}>
        {demande.statut === "retiree"
          ? "L'accord a été retiré : vos coordonnées sont de nouveau cachées."
          : `${nom} n'a pas donné suite à ta demande pour cette annonce.`}
      </p>
    </div>
  );
}
