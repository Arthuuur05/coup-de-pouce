import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../../components/ui/EcranConnecte";
import FormAnnonce from "../../../../components/annonces/FormAnnonce";
import { profilConnecte } from "../../../../lib/profil";
import { chargerAnnonce } from "../../../../lib/donnees-annonces";
import { modifierAnnonce } from "../../../../lib/actions/annonces";
import { signature } from "../../../../lib/annonces";

export const metadata = { title: "Modifier mon annonce · Coup de Pouce" };

export default async function ModifierAnnonce({ params }) {
  const { id } = await params;
  const profil = await profilConnecte();
  if (!profil) redirect(`/connexion?suite=/annonces/${id}/modifier`);
  const annonce = await chargerAnnonce(id);
  if (!annonce) notFound();
  // Seul l'auteur voit ce formulaire (et la base refuse de toute façon la modification des autres).
  if (annonce.auteur !== profil.id) redirect(`/annonces/${id}`);

  const { type, categorie, titre, description, contrepartie, quand } = annonce;
  return (
    <EcranConnecte titre="Modifier mon annonce" onglet="annonces">
      <FormAnnonce
        action={modifierAnnonce.bind(null, id)}
        annonce={{ type, categorie, titre, description, contrepartie, quand }}
        photo={annonce.photoUrl}
        auteur={annonce.auteurProfil}
        signature={signature(profil)}
        boutonTexte="Enregistrer"
      />
    </EcranConnecte>
  );
}
