import BoutonAction from "../ui/BoutonAction";
import FormRendezVous from "./FormRendezVous";
import { annulerRendezVous } from "../../lib/actions/calendrier";
import { dateVersParis, jourHeure, dans } from "../../lib/calendrier";

// Le rendez-vous d'une demande acceptée : le voir, le changer, l'annuler, l'ajouter à son agenda.
export default function RendezVous({ demandeId, rdv }) {
  const minimum = dateVersParis(new Date());
  const passe = rdv && new Date(rdv.quand).getTime() < Date.now();
  return (
    <section className="rdv" aria-label="Rendez-vous">
      <h4 className="rdv__titre">📅 Rendez-vous</h4>
      {rdv ? (
        <>
          <p className="rdv__quand">
            <strong>{jourHeure(rdv.quand)}</strong>
            <span className="carte__date">{passe ? " · passé" : ` · ${dans(rdv.quand)}`}</span>
          </p>
          {rdv.lieu && <p className="rdv__lieu">📍 {rdv.lieu}</p>}
          <div className="demande__boutons">
            {!passe && (
              <a href={`/calendrier/ics?demande=${demandeId}`} className="bouton bouton--secondaire demande__petit">
                Ajouter à mon agenda
              </a>
            )}
            <form action={annulerRendezVous.bind(null, demandeId)}>
              <BoutonAction className="bouton bouton--danger demande__petit" confirmer="Annuler ce rendez-vous ? L'autre personne sera prévenue.">
                Annuler
              </BoutonAction>
            </form>
          </div>
          <details className="rdv__changer">
            <summary>Changer la date ou le lieu</summary>
            <FormRendezVous demandeId={demandeId} quandActuel={dateVersParis(rdv.quand)} lieuActuel={rdv.lieu} minimum={minimum} />
          </details>
        </>
      ) : (
        <>
          <p className="champ__aide" style={{ margin: 0 }}>
            Fixez une date : l'autre personne est prévenue, et vous recevez tous les deux un rappel la veille.
          </p>
          <FormRendezVous demandeId={demandeId} minimum={minimum} />
        </>
      )}
    </section>
  );
}
