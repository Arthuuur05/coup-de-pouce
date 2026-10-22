// Carré noir avec l'initiale du prénom (en attendant la photo de profil).
export default function Initiale({ prenom, grande = false }) {
  const lettre = (prenom || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`initiale${grande ? " initiale--grande" : ""}`} aria-hidden="true">
      {lettre}
    </span>
  );
}
