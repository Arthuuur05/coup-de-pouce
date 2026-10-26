import { redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import Message from "../../../components/ui/Message";
import Etiquette from "../../../components/ui/Etiquette";
import Besoins from "../../../components/meteo/Besoins";
import FormBulletin from "../../../components/meteo/FormBulletin";
import { profilConnecte } from "../../../lib/profil";
import { chargerBulletinSemaine } from "../../../lib/donnees-meteo";
import { genererBulletin } from "../../../lib/actions/meteo";
import { lundiDeLaSemaine, dateLongue } from "../../../lib/meteo";

export const metadata = { title: "Relecture météo · Coup de Pouce" };

const MESSAGES = {
  genere: ["ok", "Bulletin calculé depuis les annonces de la semaine. Relis-le avant de le publier."],
  erreur: ["erreur", "Le bulletin n'a pas pu être calculé. Réessaie dans un instant."],
  publie: ["erreur", "Ce bulletin est publié : dépublie-le avant de le recalculer."],
};

export default async function RelectureMeteo({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil?.est_admin) redirect("/meteo");
  const semaine = lundiDeLaSemaine();
  const bulletin = await chargerBulletinSemaine(semaine);
  const message = retour.ok ? MESSAGES[retour.ok] : retour.erreur ? MESSAGES[retour.erreur] ?? MESSAGES.erreur : null;

  return (
    <EcranConnecte titre="Relecture météo" sousTitre={`Semaine du ${dateLongue(semaine)}. Réservé à l'administratrice.`} onglet="meteo">
      {message && <Message type={message[0]}>{message[1]}</Message>}
      {!bulletin ? (
        <EtatVide titre="Pas encore de bulletin cette semaine">
          <p style={{ margin: "0 0 12px" }}>On calcule le top 3 des catégories les plus cherchées ces 7 derniers jours.</p>
          <form action={genererBulletin}>
            <button type="submit" className="bouton bouton--accent">
              Préparer le bulletin
            </button>
          </form>
        </EtatVide>
      ) : (
        <>
          <div className="rangee">
            <Etiquette variante={bulletin.statut === "publie" ? "acceptee" : "attente"}>
              {bulletin.statut === "publie" ? "Publié" : "Brouillon"}
            </Etiquette>
          </div>
          <Besoins besoins={bulletin.besoins} action={false} />
          <FormBulletin key={bulletin.modifie_le} bulletin={bulletin} />
          {bulletin.statut === "brouillon" && (
            <form action={genererBulletin}>
              <button type="submit" className="bouton bouton--secondaire demande__petit">
                Recalculer (écrase mes modifications)
              </button>
            </form>
          )}
        </>
      )}
    </EcranConnecte>
  );
}
