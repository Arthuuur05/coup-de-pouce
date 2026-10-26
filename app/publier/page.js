import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import Message from "../../components/ui/Message";
import FormAnnonce from "../../components/annonces/FormAnnonce";
import { profilConnecte } from "../../lib/profil";
import { chargerMesAnnonces, adresseMaPhoto } from "../../lib/donnees-annonces";
import { publierAnnonce } from "../../lib/actions/annonces";
import { estEnLigne, signature, MAX_EN_LIGNE, TYPES, CATEGORIES } from "../../lib/annonces";

export const metadata = { title: "Publier · Coup de Pouce" };

// « Je peux aider » arrive ici avec le type et la catégorie déjà choisis.
const prereglage = ({ type, categorie }) => ({
  ...(TYPES[type] && { type }),
  ...(CATEGORIES.includes(categorie) && { categorie }),
});

export default async function Publier({ searchParams }) {
  const reglages = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/publier");
  const enLigne = (await chargerMesAnnonces(profil.id)).filter(estEnLigne).length;
  const photo = await adresseMaPhoto(profil.photo);

  return (
    <EcranConnecte titre="Publier une annonce" sousTitre="Tu proposes ou tu cherches ? En ligne pendant 30 jours." onglet="publier">
      {enLigne >= MAX_EN_LIGNE ? (
        <Message>
          Tu as déjà {MAX_EN_LIGNE} annonces en ligne, c'est le maximum. Marque-en une « C'est réglé » ou supprime-la depuis{" "}
          <Link href="/profil#mes-annonces">ton profil</Link>.
        </Message>
      ) : (
        <FormAnnonce
          action={publierAnnonce}
          annonce={prereglage(reglages)}
          signature={signature(profil)}
          auteur={{ prenom: profil.prenom, photoUrl: photo }}
          aideRedaction
          campusMoi={profil.campus}
        />
      )}
    </EcranConnecte>
  );
}
