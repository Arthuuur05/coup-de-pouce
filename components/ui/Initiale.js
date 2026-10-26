// Photo de profil carrée, ou carré noir avec l'initiale du prénom quand il n'y a pas de photo.
// taille : "normale" (40 px), "grande" (72 px, profil) ou "petite" (24 px, cartes).
export default function Initiale({ prenom, photo, grande = false, petite = false }) {
  const classe = `initiale${grande ? " initiale--grande" : ""}${petite ? " initiale--petite" : ""}`;
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={`${classe} initiale--photo`} />;
  }
  const lettre = (prenom || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={classe} aria-hidden="true">
      {lettre}
    </span>
  );
}
