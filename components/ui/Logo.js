// Le logo : un carré rouge avec un pouce levé, et le nom. grand : version de la page d'accueil.
export function MarqueLogo({ taille = 40 }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" role="img" aria-label="Logo Coup de Pouce">
      <rect x="2" y="2" width="44" height="44" fill="#c62828" stroke="#111" strokeWidth="3" />
      <path
        d="M17 22v14h-5V22zM20 36V22l5-9c1.6-.2 3 1 2.8 2.7L27 20h8c1.9 0 3.2 1.8 2.7 3.6l-2.4 9c-.4 1.4-1.7 2.4-3.1 2.4z"
        fill="#fff"
      />
    </svg>
  );
}

export default function Logo({ grand = false }) {
  return (
    <span className={`logo-complet${grand ? " logo-complet--grand" : ""}`}>
      <MarqueLogo taille={grand ? 72 : 36} />
      <span className="logo">
        Coup de Pouce<span>.</span>
      </span>
    </span>
  );
}
