// couleur : nom court d'une catégorie (photo, video…) pour son fond « papier d'affiche ».
export default function Etiquette({ variante = "categorie", couleur, children }) {
  return <span className={`etiquette etiquette--${variante}${couleur ? ` etiquette--${couleur}` : ""}`}>{children}</span>;
}
