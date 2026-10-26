import { redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import Message from "../../../components/ui/Message";
import { profilConnecte } from "../../../lib/profil";
import { chargerStats } from "../../../lib/donnees-stats";

export const metadata = { title: "Statistiques · Coup de Pouce" };

const heures = (h) => (h === null || h === undefined ? "—" : h < 1 ? "moins d'1 h" : h < 48 ? `${String(h).replace(".", ",")} h` : `${Math.round(h / 24)} j`);
const pourcent = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");

function Chiffre({ valeur, label, detail }) {
  return (
    <div className="carte carte--ombre-noire chiffre">
      <span className="chiffre__valeur">{valeur}</span>
      <span className="chiffre__label">{label}</span>
      {detail && <span className="carte__date">{detail}</span>}
    </div>
  );
}

// Barres horizontales : largeur = part du plus grand. Le texte dit déjà tout, la barre aide l'œil.
function Barres({ titre, lignes }) {
  const max = Math.max(1, ...lignes.map((l) => l.nombre));
  return (
    <section className="barres" aria-label={titre}>
      <h2>{titre}</h2>
      {lignes.length === 0 ? (
        <p className="carte__date" style={{ margin: 0 }}>Rien pour l'instant.</p>
      ) : (
        <ul>
          {lignes.map((l) => (
            <li key={l.nom}>
              <span className="barres__nom">{l.nom}</span>
              <span className="barres__barre" aria-hidden="true">
                <span style={{ width: `${(l.nombre / max) * 100}%` }} />
              </span>
              <span className="barres__nombre">{l.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function Stats() {
  const profil = await profilConnecte();
  if (!profil?.est_admin) redirect("/annonces");
  const { stats: s, erreur } = await chargerStats();

  return (
    <EcranConnecte titre="Statistiques" sousTitre="Où en est le campus. Réservé à l'administratrice." onglet="profil">
      {erreur || !s ? (
        <Message>Les statistiques n'ont pas pu être chargées. Réessaie dans un instant.</Message>
      ) : (
        <>
          <div className="chiffres">
            <Chiffre valeur={s.etudiants} label="Étudiants" detail={`+${s.etudiants_7j} cette semaine`} />
            <Chiffre valeur={s.annonces_en_ligne} label="Annonces en ligne" detail={`${s.annonces_total} au total · +${s.annonces_7j} cette semaine`} />
            <Chiffre
              valeur={pourcent(s.demandes.acceptees, s.demandes.acceptees + s.demandes.refusees)}
              label="Demandes acceptées"
              detail={`${s.demandes.total} demandes · ${s.demandes.en_attente} en attente`}
            />
            <Chiffre valeur={heures(s.demandes.delai_moyen_heures)} label="Délai moyen de réponse" />
            <Chiffre valeur={s.avis.moyenne ? String(s.avis.moyenne).replace(".", ",") : "—"} label="Note moyenne" detail={`${s.avis.total} avis`} />
            <Chiffre valeur={s.messages} label="Messages échangés" detail={`${s.signalements_ouverts} signalement${s.signalements_ouverts > 1 ? "s" : ""} à traiter`} />
          </div>
          <div className="deux-barres">
            <Barres
              titre="Annonces en ligne par type"
              lignes={[
                { nom: "Je propose", nombre: s.par_type.propose },
                { nom: "Je cherche", nombre: s.par_type.cherche },
              ]}
            />
            <Barres titre="Annonces en ligne par catégorie" lignes={s.par_categorie} />
            <Barres titre="Annonces en ligne par campus" lignes={s.par_campus} />
          </div>
        </>
      )}
    </EcranConnecte>
  );
}
