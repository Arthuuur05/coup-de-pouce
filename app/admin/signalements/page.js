import { redirect } from "next/navigation";
import Link from "next/link";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import Message from "../../../components/ui/Message";
import Etiquette from "../../../components/ui/Etiquette";
import PucesFiltre from "../../../components/ui/PucesFiltre";
import BoutonAction from "../../../components/ui/BoutonAction";
import { profilConnecte } from "../../../lib/profil";
import { chargerFileSignalements } from "../../../lib/donnees-signalements";
import { traiterSignalement, retirerAnnonce } from "../../../lib/actions/signalements";
import { MOTIFS } from "../../../lib/signalements";
import { dateRelative } from "../../../lib/annonces";

export const metadata = { title: "Signalements · Coup de Pouce" };

const STATUTS = { ouvert: "À traiter", traite: "Traités", classe: "Classés sans suite" };

export default async function Signalements({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil?.est_admin) redirect("/annonces");
  const { signalements, erreur } = await chargerFileSignalements();
  const statut = STATUTS[retour.statut] ? retour.statut : "ouvert";
  const liste = signalements.filter((s) => s.statut === statut);
  const nombre = (cle) => signalements.filter((s) => s.statut === cle).length;

  return (
    <EcranConnecte titre="Signalements" sousTitre="Annonces et profils signalés. Réservé à l'administratrice." onglet="profil">
      {retour.ok === "retiree" && <Message type="ok">L'annonce est retirée.</Message>}
      {(retour.erreur || erreur) && <Message>Cette action n'a pas pu être faite. Réessaie dans un instant.</Message>}
      <PucesFiltre
        nom="Filtrer les signalements"
        actif={statut}
        lien={(v) => `/admin/signalements${v === "ouvert" ? "" : `?statut=${v}`}`}
        options={Object.entries(STATUTS).map(([cle, label]) => [cle, label, nombre(cle)])}
      />
      {liste.length === 0 ? (
        <EtatVide titre={statut === "ouvert" ? "Rien à traiter" : "Rien ici"}>
          {statut === "ouvert" ? "Aucun signalement en attente. Tout est calme." : "Aucun signalement dans cette liste."}
        </EtatVide>
      ) : (
        <div className="demandes">
          {liste.map((s) => (
            <article key={s.id} className="carte carte--ombre-noire demande">
              <div className="demande__haut">
                <Etiquette variante="refusee">{MOTIFS[s.motif]}</Etiquette>
                <span className="carte__date">{dateRelative(s.cree_le)}</span>
              </div>
              <p style={{ margin: 0 }}>
                {s.annonce ? (
                  <>
                    Annonce <Link href={`/annonces/${s.annonce}`}>« {s.annonce_titre} »</Link>
                  </>
                ) : (
                  <>
                    Profil <Link href={`/etudiants/${s.profil}`}>{s.cible_prenom || "Un étudiant"}</Link>
                  </>
                )}
                {s.annonce && s.cible_prenom ? <> de {s.cible_prenom}</> : null}
              </p>
              {s.detail ? <blockquote className="demande__message">{s.detail}</blockquote> : <p className="carte__date" style={{ margin: 0 }}>Pas de détail.</p>}
              <p className="carte__date" style={{ margin: 0 }}>
                Signalé par {s.signaleur_prenom || "un étudiant"}
                {s.autres_signalements > 0 ? ` · ${s.autres_signalements} autre${s.autres_signalements > 1 ? "s" : ""} signalement${s.autres_signalements > 1 ? "s" : ""} sur la même cible` : ""}
              </p>
              {s.statut === "ouvert" ? (
                <div className="demande__boutons">
                  {s.annonce && (
                    <form action={retirerAnnonce.bind(null, s.id)}>
                      <BoutonAction className="bouton bouton--danger" confirmer="Retirer cette annonce pour de bon ?">
                        Retirer l'annonce
                      </BoutonAction>
                    </form>
                  )}
                  <form action={traiterSignalement.bind(null, s.id, "traite")}>
                    <BoutonAction className="bouton bouton--accent">C'est traité</BoutonAction>
                  </form>
                  <form action={traiterSignalement.bind(null, s.id, "classe")}>
                    <BoutonAction className="bouton bouton--secondaire">Classer sans suite</BoutonAction>
                  </form>
                </div>
              ) : (
                <form action={traiterSignalement.bind(null, s.id, "ouvert")}>
                  <BoutonAction className="bouton bouton--secondaire demande__petit">Rouvrir</BoutonAction>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </EcranConnecte>
  );
}
