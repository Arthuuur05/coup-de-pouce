import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import Message from "../../../components/ui/Message";
import FicheAnnonce from "../../../components/annonces/FicheAnnonce";
import { profilConnecte } from "../../../lib/profil";
import { chargerAnnonce, chargerIdsFavoris } from "../../../lib/donnees-annonces";
import { chargerMaDemande, chargerMesCoordonnees, compterDemandesAnnonce } from "../../../lib/donnees-demandes";
import { aDesCoordonnees } from "../../../lib/demandes";
import { TYPES, MAX_EN_LIGNE } from "../../../lib/annonces";

export async function generateMetadata({ params }) {
  const annonce = await chargerAnnonce((await params).id);
  return { title: `${annonce?.titre ?? "Annonce"} · Coup de Pouce` };
}

const MESSAGES = {
  publiee: "Ton annonce est en ligne pour 30 jours.",
  modifiee: "Ton annonce est à jour.",
  reglee: "Bien joué ! Ton annonce sort du fil, elle reste dans ton profil.",
  remise: "Ton annonce est de nouveau en ligne pour 30 jours.",
};
const DEMANDE = {
  envoyee: "Demande envoyée ! Tu verras les coordonnées dès que ta demande sera acceptée.",
  annulee: "Ta demande est annulée.",
};

export default async function DetailAnnonce({ params, searchParams }) {
  const { id } = await params;
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect(`/connexion?suite=/annonces/${id}`);
  const annonce = await chargerAnnonce(id);
  if (!annonce) notFound();

  const succes = Object.keys(MESSAGES).find((cle) => retour[cle]);
  const moi = annonce.auteur === profil.id;
  const [favoris, maDemande, mesCoordonnees, demandesRecues] = await Promise.all([
    chargerIdsFavoris(),
    moi ? {} : chargerMaDemande(annonce.id, profil.id, annonce.auteur),
    moi ? null : chargerMesCoordonnees(profil.id),
    moi ? compterDemandesAnnonce(annonce.id) : null,
  ]);

  return (
    <EcranConnecte titre={TYPES[annonce.type]} onglet="annonces">
      {succes && <Message type="ok">{MESSAGES[succes]}</Message>}
      {DEMANDE[retour.demande] && <Message type="ok">{DEMANDE[retour.demande]}</Message>}
      {retour.limite && (
        <Message>
          Tu as déjà {MAX_EN_LIGNE} annonces en ligne. Marque-en une « C'est réglé » avant de remettre celle-ci en ligne.
        </Message>
      )}
      <FicheAnnonce
        annonce={annonce}
        moi={moi}
        favori={favoris.has(annonce.id)}
        maDemande={maDemande}
        sansCoordonnees={!moi && !aDesCoordonnees(mesCoordonnees)}
        demandesRecues={demandesRecues}
      />
    </EcranConnecte>
  );
}
