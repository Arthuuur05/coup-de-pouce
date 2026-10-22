// Place réservée d'un écran pas encore construit, ou liste vide.
export default function EtatVide({ titre, children }) {
  return (
    <div className="etat-vide">
      <div className="etat-vide__titre">{titre}</div>
      {children && <div>{children}</div>}
    </div>
  );
}
