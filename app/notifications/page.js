import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import BoutonAction from "../../components/ui/BoutonAction";
import PucesFiltre from "../../components/ui/PucesFiltre";
import Initiale from "../../components/ui/Initiale";
import { profilConnecte } from "../../lib/profil";
import { chargerMesNotifications } from "../../lib/donnees-notifications";
import { NOTIFICATIONS } from "../../lib/notifications";
import { dateRelative } from "../../lib/annonces";
import { toutMarquerLu, toutEffacer } from "../../lib/actions/notifications";

export const metadata = { title: "Notifications · Coup de Pouce" };

export default async function Notifications({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/notifications");
  const notifications = await chargerMesNotifications();
  const nonLues = notifications.filter((n) => !n.lue_le).length;
  const seulementNonLues = retour.vue === "non-lues";
  const affichees = seulementNonLues ? notifications.filter((n) => !n.lue_le) : notifications;

  return (
    <EcranConnecte titre="Notifications" sousTitre="Les réponses à tes demandes et tes nouveaux avis." onglet="notifications">
      {notifications.length === 0 ? (
        <EtatVide titre="Rien de nouveau">Tu seras prévenu ici quand quelqu'un te demande ton contact ou répond à ta demande.</EtatVide>
      ) : (
        <>
          <PucesFiltre
            nom="Filtrer les notifications"
            actif={seulementNonLues ? "non-lues" : ""}
            lien={(v) => (v ? `/notifications?vue=${v}` : "/notifications")}
            options={[
              ["", "Toutes", notifications.length],
              ["non-lues", "Non lues", nonLues],
            ]}
          />
          <div className="rangee">
            {nonLues > 0 && (
              <form action={toutMarquerLu}>
                <BoutonAction className="bouton" enCours="…">Tout marquer comme lu</BoutonAction>
              </form>
            )}
            <form action={toutEffacer}>
              <BoutonAction className="bouton" confirmer="Effacer toutes tes notifications ?">Tout effacer</BoutonAction>
            </form>
          </div>
          {affichees.length === 0 && <EtatVide titre="Tout est lu">Aucune notification non lue.</EtatVide>}
          <ul className="notifications">
            {affichees.map((n) => {
              const def = NOTIFICATIONS[n.type];
              const prenom = n.acteurProfil?.prenom || "Un étudiant";
              return (
                <li key={n.id}>
                  <Link href={def.lien(n)} className={`notification${n.lue_le ? "" : " notification--nouvelle"}`}>
                    <Initiale prenom={n.acteurProfil?.prenom} photo={n.acteurProfil?.photoUrl} />
                    <span className="notification__texte">
                      <strong>{prenom}</strong> {def.verbe} « {n.titre} »
                      <span className="carte__date">{dateRelative(n.cree_le)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </EcranConnecte>
  );
}
