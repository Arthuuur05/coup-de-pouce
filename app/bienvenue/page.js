import Link from "next/link";
import { redirect } from "next/navigation";
import FormPhotoProfil from "../../components/compte/FormPhotoProfil";
import FormCompetences from "../../components/competences/FormCompetences";
import FormCoordonnees from "../../components/demandes/FormCoordonnees";
import { profilConnecte } from "../../lib/profil";
import { adresseMaPhoto } from "../../lib/donnees-annonces";
import { chargerMesCoordonnees } from "../../lib/donnees-demandes";
import { chargerCompetences } from "../../lib/donnees-competences";

export const metadata = { title: "Bienvenue · Coup de Pouce" };

const ETAPES = [
  ["photo", "Ta photo", "Un visage, c'est plus sympa pour demander ou proposer un coup de pouce."],
  ["competences", "Ce que tu sais faire", "Liste tes compétences, séparées par des virgules. Les autres pourront les confirmer."],
  ["contact", "Comment te joindre", "Visible seulement par les personnes dont tu acceptes la demande."],
];

// Premier écran après l'inscription : on crée son profil en trois petites étapes, qu'on peut passer.
export default async function Bienvenue({ searchParams }) {
  const { etape } = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/bienvenue");
  const numero = Math.min(ETAPES.length, Math.max(1, Number(etape) || 1));
  const [cle, titre, aide] = ETAPES[numero - 1];
  const derniere = numero === ETAPES.length;
  const suite = derniere ? "/annonces" : `/bienvenue?etape=${numero + 1}`;

  const [photo, competences, coordonnees] = await Promise.all([
    cle === "photo" ? adresseMaPhoto(profil.photo) : null,
    cle === "competences" ? chargerCompetences(profil.id) : [],
    cle === "contact" ? chargerMesCoordonnees(profil.id) : null,
  ]);

  return (
    <main id="contenu" className="page bienvenue">
      <Link href="/" className="logo">
        Coup de Pouce<span>.</span>
      </Link>
      <p className="kicker-bienvenue">
        Bienvenue {profil.prenom} · étape {numero} sur {ETAPES.length}
      </p>
      <div className="progression" role="progressbar" aria-valuemin={1} aria-valuemax={ETAPES.length} aria-valuenow={numero} aria-label="Étapes de création du profil">
        {ETAPES.map(([id], i) => (
          <span key={id} className={`progression__etape${i < numero ? " progression__etape--faite" : ""}`} />
        ))}
      </div>
      <div className="titre-ecran">
        <h1>{titre}</h1>
        <p className="sous-titre">{aide}</p>
      </div>
      {cle === "photo" && <FormPhotoProfil photo={photo} />}
      {cle === "competences" && <FormCompetences competences={competences} />}
      {cle === "contact" && <FormCoordonnees coordonnees={coordonnees} />}
      <div className="rangee">
        <Link href={suite} className="bouton bouton--accent">
          {derniere ? "Terminer et voir les annonces" : "Suivant →"}
        </Link>
        {!derniere && (
          <Link href="/annonces" className="bouton bouton--secondaire">
            Plus tard
          </Link>
        )}
      </div>
    </main>
  );
}
