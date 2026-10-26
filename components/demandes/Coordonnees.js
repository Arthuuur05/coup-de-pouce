// Les coordonnées de l'autre personne, affichées seulement après un accord.
export default function Coordonnees({ prenom, coordonnees }) {
  const c = coordonnees ?? {};
  const lignes = [
    c.email && ["E-mail", c.email, `mailto:${c.email}`],
    c.telephone && ["Téléphone", c.telephone, `tel:${c.telephone.replace(/[^+0-9]/g, "")}`],
    c.instagram && ["Instagram", `@${c.instagram}`, `https://instagram.com/${c.instagram}`],
  ].filter(Boolean);
  return (
    <div className="coordonnees">
      <div className="coordonnees__titre">Les coordonnées de {prenom || "ton contact"}</div>
      {lignes.length ? (
        <dl className="coordonnees__liste">
          {lignes.map(([label, valeur, lien]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <a href={lien} target={lien.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {valeur}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p style={{ margin: 0 }}>{prenom || "Cette personne"} n'a pas encore rempli ses coordonnées.</p>
      )}
    </div>
  );
}
