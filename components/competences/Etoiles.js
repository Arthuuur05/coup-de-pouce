import { IconeEtoile } from "../ui/Icones";

// Une note sur 5, en étoiles. taille : côté d'une étoile en pixels.
export default function Etoiles({ note, taille = 18 }) {
  const arrondie = Math.round(note);
  return (
    <span className="etoiles" role="img" aria-label={`Note : ${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconeEtoile key={n} plein={n <= arrondie} width={taille} height={taille} />
      ))}
    </span>
  );
}
