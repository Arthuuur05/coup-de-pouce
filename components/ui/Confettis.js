// Pluie de confettis pour fêter une bonne nouvelle (demande acceptée…).
// Pur CSS, décoratif, et coupé si la personne a demandé moins d'animations.
const COULEURS = ["rouge", "noir", "ambre", "vert", "blanc"];

export default function Confettis({ nombre = 18 }) {
  return (
    <span className="confettis" aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <i
          key={i}
          className={`confettis__piece confettis__piece--${COULEURS[i % COULEURS.length]}`}
          style={{
            "--x": `${((i * 37) % 100) - 50}px`,
            "--r": `${((i * 71) % 360) - 180}deg`,
            "--d": `${(i % 6) * 0.04}s`,
            left: `${(i * 100) / nombre}%`,
          }}
        />
      ))}
    </span>
  );
}
