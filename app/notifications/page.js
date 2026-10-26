import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import BoutonAction from "../../components/ui/BoutonAction";
import PucesFiltre from "../../components/ui/PucesFiltre";
import Initiale from "../../components/ui/Initiale";
import { profilConnecte } from "../../lib/profil";
import { chargerMesNotifications } from "../../lib/donnees-notifications";
import { chargerMesAlertes } from "../../lib/donnees-alertes";
import { libelleAlerte, ALERTES_MAX } from "../../lib/alertes";
import { NOTIFICATIONS } from "../../lib/notifications";
import { dateRelative } from "../../lib/annonces";
import { toutMarquerLu, toutEffacer } from "../../lib/actions/notifications";
import { supprimerAlerte } from "../../lib/actions/alertes";

export const metadata = { title: "Notifications · Coup de Pouce" };

export default async function Notifications({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/notifications");
  const [notifications, alertes] = await Promise.all([chargerMesNotifications(), chargerMesAlertes()]);
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
      <div className="titre-section" id="mes-alertes">
        <h2>Mes alertes</h2>
        <span className="carte__date">
          {alertes.length}/{ALERTES_MAX}
        </span>
      </div>
      {alertes.length === 0 ? (
        <EtatVide titre="Pas d'alerte">
          <p style={{ margin: "0 0 12px" }}>Cherche quelque chose sur le fil, puis touche « Me prévenir » : tu seras notifié des nouvelles annonces qui correspondent.</p>
          <Link href="/annonces" className="bouton bouton--secondaire">
            Aller au fil
          </Link>
        </EtatVide>
      ) : (
        <ul className="notifications">
          {alertes.map((a) => (
            <li key={a.id} className="notification alerte">
              <span className="notification__texte">{libelleAlerte(a)}</span>
              <form action={supprimerAlerte.bind(null, a.id)}>
                <BoutonAction className="bouton bouton--secondaire demande__petit" confirmer="Supprimer cette alerte ?">
                  Supprimer
                </BoutonAction>
              </form>
            </li>
          ))}
        </ul>
      )}
    </EcranConnecte>
  );
}
