import Link from "next/link";
import Etiquette from "./Etiquette";

// type : "propose" ou "cherche". index sert à alterner l'inclinaison et l'ombre.
// href : toute la carte devient cliquable. extrait : début de la description. etat : { texte, variante } (mes annonces).
export default function CarteAnnonce({ type, categorie, titre, auteur, date, href, extrait, etat, index = 0 }) {
  const pair = index % 2 === 0;
  const classe = `carte ${pair ? "carte--ombre-noire carte--gauche" : "carte--ombre-rouge carte--droite"}${href ? " carte--lien" : ""}`;
  return (
    <article className={classe}>
      <div className="carte__haut">
        <Etiquette variante={type}>
          {type === "propose" ? "Je propose" : "Je cherche"} · {categorie}
        </Etiquette>
        {etat ? <Etiquette variante={etat.variante}>{etat.texte}</Etiquette> : <span className="carte__date">{date}</span>}
      </div>
      <h3 className="carte__titre">{href ? <Link href={href}>{titre}</Link> : titre}</h3>
      {extrait && <p className="carte__extrait">{extrait}</p>}
      <div className="carte__bas">
        <span className="carte__auteur">{auteur}</span>
        {href && (
          <span className="carte__voir" aria-hidden="true">
            Voir →
          </span>
        )}
      </div>
    </article>
  );
}
