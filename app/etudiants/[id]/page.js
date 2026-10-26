import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import Initiale from "../../../components/ui/Initiale";
import CarteAnnonce from "../../../components/ui/CarteAnnonce";
import Etoiles from "../../../components/competences/Etoiles";
import ListeCompetences from "../../../components/competences/ListeCompetences";
import ListeAvis from "../../../components/competences/ListeAvis";
import Niveau from "../../../components/badges/Niveau";
import ListeBadges from "../../../components/badges/ListeBadges";
import Signaler from "../../../components/signalements/Signaler";
import { profilConnecte } from "../../../lib/profil";
import { chargerProfilPublic, chargerIdsFavoris } from "../../../lib/donnees-annonces";
import { basculerFavori } from "../../../lib/actions/annonces";
import { chargerCompetences, chargerAvis, chargerCv, chargerCoupsDePouce } from "../../../lib/donnees-competences";
import { chargerBadges } from "../../../lib/donnees-badges";
import { dateRelative } from "../../../lib/annonces";

export const metadata = { title: "Profil · Coup de Pouce" };

// Ce que les autres étudiants voient de quelqu'un : photo, prénom, filière, année, campus et annonces en ligne.
// Jamais le nom de famille, l'e-mail ni les annonces réglées ou expirées.
export default async function ProfilPublic({ params, searchParams }) {
  const { id } = await params;
  const retour = await searchParams;
  const moi = await profilConnecte();
  if (!moi) redirect(`/connexion?suite=/etudiants/${id}`);
  const [donnees, favoris, competences, coups, cv, badges] = await Promise.all([
    chargerProfilPublic(id),
    chargerIdsFavoris(),
    chargerCompetences(id),
    chargerCoupsDePouce(id),
    chargerCv(id),
    chargerBadges(id),
  ]);
  const competenceChoisie = competences.find((c) => c.id === retour.competence);
  const [avis, tousLesAvis] = await Promise.all([chargerAvis(id, competenceChoisie?.id), competenceChoisie ? chargerAvis(id) : null]);
  if (!donnees) notFound();
  const { profil, annonces } = donnees;
  const cEstMoi = id === moi.id;
  const extrait = (t) => (t.length > 120 ? `${t.slice(0, 117).trimEnd()}…` : t);

  return (
    <EcranConnecte titre={profil.prenom || "Un étudiant"} onglet={cEstMoi ? "profil" : "annonces"}>
      {cEstMoi && <p className="sous-titre">C'est ce que les autres étudiants voient de toi.</p>}
      <div className="deux-colonnes">
        <aside className="carte carte--ombre-rouge fiche-profil">
          <Initiale prenom={profil.prenom} photo={profil.photoUrl} grande />
          <div style={{ minWidth: 0 }}>
            <h3>{profil.prenom || "Un étudiant"}</h3>
            {(profil.filiere || profil.annee) && (
              <div style={{ fontWeight: 700, fontSize: 14 }}>{[profil.filiere, profil.annee].filter(Boolean).join(" · ")}</div>
            )}
            {profil.campus && <div style={{ fontSize: 14 }}>Campus {profil.campus}</div>}
            {!cEstMoi && <Signaler cible="profil" id={id} />}
            {(tousLesAvis ?? avis).total > 0 && (
              <div className="fiche-profil__note">
                <Etoiles note={(tousLesAvis ?? avis).moyenne} taille={16} /> {String((tousLesAvis ?? avis).moyenne).replace(".", ",")} ({(tousLesAvis ?? avis).total})
              </div>
            )}
            {coups > 0 && (
              <div className="fiche-profil__coups">
                🤝 {coups} coup{coups > 1 ? "s" : ""} de pouce rendu{coups > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </aside>

        <div className="profil__contenu">
          <div className="titre-section">
            <h2>{cEstMoi ? "Mes compétences" : "Ses compétences"}</h2>
          </div>
          <ListeCompetences
            competences={competences}
            vide={cEstMoi ? "Ajoute tes compétences depuis ton profil." : "Aucune compétence indiquée."}
            lien={(c) => (competenceChoisie?.id === c.id ? `/etudiants/${id}#avis` : `/etudiants/${id}?competence=${c.id}#avis`)}
            actif={competenceChoisie?.id}
          />
          {competences.length > 0 && <p className="champ__aide" style={{ margin: 0 }}>Touche une compétence pour voir les avis qui la confirment.</p>}
          {badges && badges.gagnes.length > 0 && (
            <>
              <div className="titre-section">
                <h2>{cEstMoi ? "Mes badges" : "Ses badges"}</h2>
              </div>
              <Niveau niveau={badges.niveau} />
              <ListeBadges gagnes={badges.gagnes} />
            </>
          )}
          {cv && (
            <a href={cv.adresse} target="_blank" rel="noreferrer" className="bouton bouton--secondaire" style={{ alignSelf: "flex-start" }}>
              {cEstMoi ? "Mon CV" : `Télécharger son CV`} (PDF)
            </a>
          )}

          <div className="titre-section">
            <h2>{cEstMoi ? "Mes annonces en ligne" : "Ses annonces"}</h2>
            <span className="carte__date">{annonces.length} en ligne</span>
          </div>
          {annonces.length === 0 ? (
            <EtatVide titre="Rien en ce moment">
              {cEstMoi ? "Tu n'as pas d'annonce en ligne." : `${profil.prenom || "Cet étudiant"} n'a pas d'annonce en ligne.`}
            </EtatVide>
          ) : (
            <div className="fil fil--profil">
              {annonces.map((a, i) => {
                const favori = favoris.has(a.id);
                return (
                  <CarteAnnonce
                    key={a.id}
                    index={i}
                    type={a.type}
                    categorie={a.categorie}
                    titre={a.titre}
                    extrait={extrait(a.description)}
                    photo={a.photoUrl}
                    auteur={`Publiée ${dateRelative(a.cree_le)}`}
                    href={`/annonces/${a.id}`}
                    favori={favori}
                    actionFavori={cEstMoi ? undefined : basculerFavori.bind(null, a.id, favori)}
                  />
                );
              })}
            </div>
          )}

          <div className="titre-section" id="avis">
            <h2>{competenceChoisie ? `Avis · ${competenceChoisie.nom}` : "Avis"}</h2>
            {avis.total > 0 && <span className="carte__date">{avis.total}</span>}
            {competenceChoisie && (
              <Link href={`/etudiants/${id}#avis`} className="filtres__effacer">
                Voir tous les avis
              </Link>
            )}
          </div>
          <ListeAvis
            resume={avis}
            moiId={moi.id}
            suite={`/etudiants/${id}`}
            vide={competenceChoisie ? "Aucun avis ne confirme cette compétence pour l'instant." : cEstMoi ? "Pas encore d'avis." : "Pas encore d'avis. Après un coup de main, tu pourras laisser le premier depuis tes demandes."}
          />
        </div>
      </div>
    </EcranConnecte>
  );
}
