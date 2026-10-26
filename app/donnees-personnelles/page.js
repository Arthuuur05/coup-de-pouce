import Link from "next/link";
import BandeauHaut from "../../components/ui/BandeauHaut";

export const metadata = { title: "Données personnelles · Coup de Pouce" };

const sections = [
  [
    "Ce qu'on garde",
    "Ton prénom, ton nom, ton e-mail, ta filière, ton année, ton campus et ta photo de profil si tu en mets une. Tes annonces (et leur photo), tes favoris, tes demandes de contact (avec leur message) et les coordonnées que tu choisis de remplir (e-mail, téléphone, Instagram). Plus tard : les compétences que tu valides depuis ton CV.",
  ],
  ["Ce qu'on ne garde pas", "Ton CV : il est lu une fois pour te proposer des compétences, puis il n'est pas conservé."],
  [
    "Qui voit quoi",
    "Les autres étudiants connectés voient ton prénom, ta photo, ta filière, ton année, ton campus et tes annonces en ligne. Ton nom et ton e-mail ne sont jamais affichés. Personne ne sait quelles annonces tu as mises en favori. Les visiteurs non connectés ne voient rien. Tes coordonnées n'apparaissent qu'aux personnes avec qui une demande a été acceptée (dans un sens ou dans l'autre), et redeviennent cachées si l'accord est retiré. Quand tu demandes un contact, l'auteur de l'annonce voit ton message.",
  ],
  ["Pourquoi", "Uniquement pour faire marcher l'entraide sur le campus. Pas de publicité, aucune revente, aucun partage hors de l'appli."],
  ["Où", "Les données sont stockées chez Supabase (base de données) et l'appli est hébergée par Vercel."],
  [
    "Combien de temps",
    "Tant que ton compte existe. Une annonce sort du fil après 30 jours ; elle reste dans ton profil jusqu'à ce que tu la supprimes. Une photo remplacée ou retirée est effacée. Une demande de contact encore en attente disparaît quand l'annonce est réglée ou supprimée.",
  ],
  [
    "Tes droits",
    "Tu peux modifier tes informations à tout moment dans ton profil, et supprimer ton compte : tout est alors effacé pour de bon, photos, demandes et coordonnées comprises.",
  ],
];

export default function DonneesPersonnelles() {
  return (
    <>
      <BandeauHaut>Tes données, en clair</BandeauHaut>
      <main id="contenu" className="page page--texte">
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
        <p className="carte__date">Dernière mise à jour : 26 octobre 2026.</p>
      </main>
    </>
  );
}
