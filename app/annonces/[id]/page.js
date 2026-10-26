import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import Message from "../../../components/ui/Message";
import FicheAnnonce from "../../../components/annonces/FicheAnnonce";
import { profilConnecte } from "../../../lib/profil";
import { chargerAnnonce, chargerIdsFavoris } from "../../../lib/donnees-annonces";
import { TYPES, MAX_EN_LIGNE } from "../../../lib/annonces";

export const metadata = { title: "Annonce · Coup de Pouce" };

const MESSAGES = {
  publiee: "Ton annonce est en ligne pour 30 jours.",
  modifiee: "Ton annonce est à jour.",
  reglee: "Bien joué ! Ton annonce sort du fil, elle reste dans ton profil.",
  remise: "Ton annonce est de nouveau en ligne pour 30 jours.",
};

export default async function DetailAnnonce({ params, searchParams }) {
  const { id } = await params;
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect(`/connexion?suite=/annonces/${id}`);
  const annonce = await chargerAnnonce(id);
  if (!annonce) notFound();

  const succes = Object.keys(MESSAGES).find((cle) => retour[cle]);
  const favoris = await chargerIdsFavoris();

  return (
    <EcranConnecte titre={TYPES[annonce.type]} onglet="annonces">
      {succes && <Message type="ok">{MESSAGES[succes]}</Message>}
      {retour.limite && (
        <Message>
          Tu as déjà {MAX_EN_LIGNE} annonces en ligne. Marque-en une « C'est réglé » avant de remettre celle-ci en ligne.
        </Message>
      )}
      <FicheAnnonce annonce={annonce} moi={annonce.auteur === profil.id} favori={favoris.has(annonce.id)} />
    </EcranConnecte>
  );
}
