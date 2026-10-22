import Etiquette from "./Etiquette";
import Bouton from "./Bouton";

// type : "propose" ou "cherche". index sert à alterner l'inclinaison et l'ombre.
export default function CarteAnnonce({ type, categorie, titre, auteur, date, href, index = 0 }) {
  const pair = index % 2 === 0;
  const classe = `carte ${pair ? "carte--ombre-noire carte--gauche" : "carte--ombre-rouge carte--droite"}`;
  return (
    <article className={classe}>
      <div className="carte__haut">
        <Etiquette variante={type}>
          {type === "propose" ? "Je propose" : "Je cherche"} · {categorie}
        </Etiquette>
        <span className="carte__date">{date}</span>
      </div>
      <h3>{titre}</h3>
      <div className="carte__bas">
        <span className="carte__auteur">{auteur}</span>
        {href && (
          <Bouton href={href} variante="principal">
            Contacter →
          </Bouton>
        )}
      </div>
    </article>
  );
}
