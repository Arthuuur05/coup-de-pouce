export default function Etiquette({ variante = "categorie", children }) {
  return <span className={`etiquette etiquette--${variante}`}>{children}</span>;
}
