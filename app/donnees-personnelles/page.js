import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";

export const metadata = { title: "Données personnelles · Coup de Pouce" };

const sections = [
  [
    "Ce qu'on garde",
    "Ton prénom, ton nom, ton e-mail, ta filière, ton année et ton campus. Plus tard : tes annonces, les demandes de mise en relation, les coordonnées que tu choisis de partager et les compétences que tu valides depuis ton CV.",
  ],
  ["Ce qu'on ne garde pas", "Ton CV : il est lu une fois pour te proposer des compétences, puis il n'est pas conservé."],
  [
    "Qui voit quoi",
    "Les autres étudiants voient ton prénom, ta filière, ton année et ton campus. Ton nom et ton e-mail ne sont jamais affichés. Tes coordonnées n'apparaissent qu'à la personne dont tu as accepté la demande.",
  ],
  ["Pourquoi", "Uniquement pour faire marcher l'entraide sur le campus. Pas de publicité, aucune revente, aucun partage hors de l'appli."],
  ["Où", "Les données sont stockées chez Supabase (base de données) et l'appli est hébergée par Vercel."],
  ["Combien de temps", "Tant que ton compte existe. Une annonce expire après 30 jours."],
  [
    "Tes droits",
    "Tu peux modifier tes informations à tout moment dans ton profil, et supprimer ton compte : tout est alors effacé pour de bon.",
  ],
];

export default function DonneesPersonnelles() {
  return (
    <>
      <BandeauHaut>Tes données, en clair</BandeauHaut>
      <main className="page page--texte">
        <Link href="/" className="logo">
          Coup de Pouce<span>.</span>
        </Link>
        <h1>Données personnelles</h1>
        <p className="sous-titre">Coup de Pouce est un projet étudiant. Voici, en quelques lignes, ce qu'on fait de tes données.</p>
        {sections.map(([titre, texte]) => (
          <section key={titre} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h3>{titre}</h3>
            <p style={{ margin: 0 }}>{texte}</p>
          </section>
        ))}
        <p className="carte__date">Dernière mise à jour : 25 octobre 2026.</p>
      </main>
    </>
  );
}
