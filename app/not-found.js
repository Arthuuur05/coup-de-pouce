import Link from "next/link";
import Bouton from "../components/ui/Bouton";

export const metadata = { title: "Introuvable · Coup de Pouce" };

export default function Introuvable() {
  return (
    <main className="page page--texte">
      <div className="entete">
        <Link href="/annonces" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
      </div>
      <h1>Introuvable</h1>
      <p className="sous-titre">Cette page n'existe pas, ou l'annonce a été supprimée, réglée ou a expiré.</p>
      <Bouton href="/annonces" variante="principal">
        Voir les annonces
      </Bouton>
    </main>
  );
}
