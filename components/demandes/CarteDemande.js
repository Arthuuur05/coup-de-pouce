import Link from "next/link";
import Etiquette from "../ui/Etiquette";
import Initiale from "../ui/Initiale";
import Coordonnees from "./Coordonnees";
import FormAvis from "../competences/FormAvis";
import { repondreDemande, annulerDemande } from "../../lib/actions/demandes";
import { statutAffiche } from "../../lib/demandes";
import { TYPES, CLASSE_CATEGORIE, dateRelative } from "../../lib/annonces";

// Une demande, reçue ou envoyée. Les boutons dépendent du sens et du statut ;
// les coordonnées de l'autre n'apparaissent qu'après l'accord.
export default function CarteDemande({ demande: d, avisDonne = false, competences = [] }) {
  const recue = d.sens === "recue";
  const autre = d.autreProfil ?? {};
  const prenom = autre.prenom || "Un étudiant";
  const statut = statutAffiche(d.statut, d.sens);
  const couleur = CLASSE_CATEGORIE[d.categorie] ?? "autre";
  const detail = [autre.filiere, autre.annee].filter(Boolean).join(" · ");
  return (
    <article id={`demande-${d.id}`} className={`carte carte--ombre-noire demande demande--${d.statut}`}>
      <div className="demande__haut">
        <Link href={`/etudiants/${d.autre}`} className="carte__auteur demande__personne">
          <Initiale prenom={autre.prenom} photo={autre.photoUrl} />
          <span style={{ minWidth: 0 }}>
            <span className="demande__prenom">{prenom}</span>
            {detail && <span className="carte__date demande__detail">{detail}</span>}
          </span>
        </Link>
        <Etiquette variante={statut.variante}>{statut.texte}</Etiquette>
      </div>

      <div className="demande__annonce">
        <span className="carte__date">{recue ? "Pour ton annonce" : "Pour l'annonce"}</span>
        <div className="rangee">
          <Etiquette variante={d.type}>{TYPES[d.type]}</Etiquette>
          <Etiquette couleur={couleur}>{d.categorie}</Etiquette>
        </div>
        {d.annonce_en_ligne ? (
          <Link href={`/annonces/${d.annonce}`} className="demande__titre">
            {d.titre}
          </Link>
        ) : (
          <span className="demande__titre">{d.titre}</span>
        )}
      </div>

      {d.message ? (
        <blockquote className="demande__message">{d.message}</blockquote>
      ) : (
        <p className="carte__date" style={{ margin: 0 }}>
          Pas de message.
        </p>
      )}
      <p className="carte__date" style={{ margin: 0 }}>
        {recue ? "Reçue" : "Envoyée"} {dateRelative(d.cree_le)}
        {d.repondu_le && d.statut !== "en_attente" ? ` · réponse ${dateRelative(d.repondu_le)}` : ""}
      </p>

      {d.statut === "acceptee" && <Coordonnees prenom={autre.prenom} coordonnees={d.coordonnees} />}

      {["acceptee", "retiree"].includes(d.statut) &&
        (avisDonne ? (
          <p className="champ__aide" style={{ margin: 0 }}>
            Tu as donné ton avis sur {prenom}. <Link href={`/etudiants/${d.autre}`}>Le voir sur son profil</Link>
          </p>
        ) : (
          <FormAvis demandeId={d.id} prenom={autre.prenom} competences={competences} />
        ))}

      {recue && d.statut === "en_attente" && (
        <div className="demande__boutons">
          <form action={repondreDemande.bind(null, d.id, "acceptee")}>
            <button type="submit" className="bouton bouton--accent">
              Accepter
            </button>
          </form>
          <form action={repondreDemande.bind(null, d.id, "refusee")}>
            <button type="submit" className="bouton bouton--secondaire">
              Refuser
            </button>
          </form>
        </div>
      )}
      {recue && d.statut === "en_attente" && (
        <p className="champ__aide" style={{ margin: 0 }}>
          Si tu acceptes, vous verrez chacun les coordonnées de l'autre.
        </p>
      )}
      {recue && d.statut === "acceptee" && (
        <form action={repondreDemande.bind(null, d.id, "retiree")}>
          <button type="submit" className="bouton bouton--danger demande__petit">
            Retirer mon accord
          </button>
        </form>
      )}
      {!recue && d.statut === "acceptee" && (
        <form action={repondreDemande.bind(null, d.id, "retiree", true)}>
          <button type="submit" className="bouton bouton--danger demande__petit">
            Ne plus partager mes coordonnées
          </button>
        </form>
      )}
      {!recue && d.statut === "en_attente" && (
        <form action={annulerDemande.bind(null, d.id, "/demandes?onglet=envoyees&annulee=1")}>
          <button type="submit" className="bouton bouton--secondaire demande__petit">
            Annuler ma demande
          </button>
        </form>
      )}
      {!recue && d.statut === "refusee" && (
        <p style={{ margin: 0 }}>{prenom} n'a pas donné suite. Il y a plein d'autres annonces sur le fil !</p>
      )}
      {recue && d.statut === "refusee" && (
        <p className="champ__aide" style={{ margin: 0 }}>
          {prenom} ne voit pas tes coordonnées.
        </p>
      )}
      {d.statut === "retiree" && (
        <p className="champ__aide" style={{ margin: 0 }}>
          L'accord a été retiré : vos coordonnées sont de nouveau cachées.
        </p>
      )}
    </article>
  );
}
