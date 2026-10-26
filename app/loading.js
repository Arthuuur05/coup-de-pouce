// Affiché pendant qu'un écran se charge : de grands blocs gris, pas d'écran blanc.
export default function Chargement() {
  return (
    <main id="contenu" className="page" aria-busy="true" aria-label="Chargement">
      <div className="squelette squelette--titre" />
      <div className="squelette squelette--ligne" />
      <div className="squelette squelette--carte" />
      <div className="squelette squelette--carte" />
      <div className="squelette squelette--carte" />
    </main>
  );
}
