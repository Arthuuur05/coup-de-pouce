import Link from "next/link";
import Etiquette from "./Etiquette";
import Initiale from "./Initiale";
import { IconeCoeur } from "./Icones";
import { CLASSE_CATEGORIE } from "../../lib/annonces";

// type : "propose" ou "cherche". index alterne l'inclinaison et l'ombre. La catégorie donne la couleur du liseré.
// href : toute la carte devient cliquable. extrait : début de la description. photo : adresse de la photo.
// avatar : { prenom, photoUrl } de l'auteur. etat : { texte, variante } à la place de la date (mes annonces).
// favori + actionFavori : le cœur (formulaire relié à une action serveur). eteinte : annonce plus disponible.
export default function CarteAnnonce({
  type,
  categorie,
  titre,
  auteur,
  date,
  href,
  extrait,
  etat,
  photo,
  avatar,
  favori,
  actionFavori,
  eteinte = false,
  index = 0,
}) {
  const pair = index % 2 === 0;
  const classe = [
    "carte",
    pair ? "carte--ombre-noire carte--gauche" : "carte--ombre-rouge carte--droite",
    `carte--categorie carte--${CLASSE_CATEGORIE[categorie] ?? "autre"}`,
    href && "carte--lien",
    eteinte && "carte--eteinte",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <article className={classe}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="carte__photo" loading="lazy" />
      )}
      <div className="carte__haut">
        <div className="carte__etiquettes">
          <Etiquette variante={type}>{type === "propose" ? "Je propose" : "Je cherche"}</Etiquette>
          <Etiquette couleur={CLASSE_CATEGORIE[categorie] ?? "autre"}>{categorie}</Etiquette>
        </div>
        {etat ? <Etiquette variante={etat.variante}>{etat.texte}</Etiquette> : <span className="carte__date">{date}</span>}
      </div>
      <h3 className="carte__titre">{href ? <Link href={href}>{titre}</Link> : titre}</h3>
      {extrait && <p className="carte__extrait">{extrait}</p>}
      <div className="carte__bas">
        <span className="carte__auteur">
          {avatar && <Initiale prenom={avatar.prenom} photo={avatar.photoUrl} petite />}
          {auteur}
        </span>
        {actionFavori ? (
          <form action={actionFavori} className="carte__favori">
            <button
              type="submit"
              className={`coeur${favori ? " coeur--plein" : ""}`}
              aria-pressed={favori ? "true" : "false"}
              aria-label={favori ? `Retirer « ${titre} » de mes favoris` : `Ajouter « ${titre} » à mes favoris`}
            >
              <IconeCoeur plein={favori} />
            </button>
          </form>
        ) : (
          href && (
            <span className="carte__voir" aria-hidden="true">
              Voir →
            </span>
          )
        )}
      </div>
    </article>
  );
}
