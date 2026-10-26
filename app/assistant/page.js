import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import Assistant from "../../components/assistant/Assistant";
import { profilConnecte } from "../../lib/profil";

export const metadata = { title: "Assistant · Coup de Pouce" };

export default async function PageAssistant() {
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/assistant");
  return (
    <EcranConnecte titre="Assistant" sousTitre="Pose ta question, je cherche dans les annonces." onglet="assistant">
      <p className="champ__aide" style={{ margin: 0 }}>
        Je suis un assistant simple, pas une intelligence artificielle : je reconnais des mots-clés (matière, catégorie, campus, jour…). La
        conversation n'est pas enregistrée.
      </p>
      <Assistant />
    </EcranConnecte>
  );
}
