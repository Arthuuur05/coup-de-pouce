import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import Initiale from "../../../components/ui/Initiale";
import CarteAnnonce from "../../../components/ui/CarteAnnonce";
import Etoiles from "../../../components/competences/Etoiles";
import ListeCompetences from "../../../components/competences/ListeCompetences";
import ListeAvis from "../../../components/competences/ListeAvis";
import { profilConnecte } from "../../../lib/profil";
import { chargerProfilPublic, chargerIdsFavoris } from "../../../lib/donnees-annonces";
import { basculerFavori } from "../../../lib/actions/annonces";
import { chargerCompetences, chargerAvis, chargerCv } from "../../../lib/donnees-competences";
import { dateRelative } from "../../../lib/annonces";

export const metadata = { title: "Profil · Coup de Pouce" };

// Ce que les autres étudiants voient de quelqu'un : photo, prénom, filière, année, campus et annonces en ligne.
// Jamais le nom de famille, l'e-mail ni les annonces réglées ou expirées.
export default async function ProfilPublic({ params }) {
  const { id } = await params;
  const moi = await profilConnecte();
  if (!moi) redirect(`/connexion?suite=/etudiants/${id}`);
  const [donnees, favoris, competences, avis, cv] = await Promise.all([
    chargerProfilPublic(id),
    chargerIdsFavoris(),
    chargerCompetences(id),
    chargerAvis(id),
    chargerCv(id),
  ]);
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
            {avis.total > 0 && (
              <div className="fiche-profil__note">
                <Etoiles note={avis.moyenne} taille={16} /> {String(avis.moyenne).replace(".", ",")} ({avis.total})
              </div>
            )}
          </div>
        </aside>

        <div className="profil__contenu">
          <div className="titre-section">
            <h2>{cEstMoi ? "Mes compétences" : "Ses compétences"}</h2>
          </div>
          <ListeCompetences competences={competences} vide={cEstMoi ? "Ajoute tes compétences depuis ton profil." : "Aucune compétence indiquée."} />
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

          <div className="titre-section">
            <h2>Avis</h2>
            {avis.total > 0 && <span className="carte__date">{avis.total}</span>}
          </div>
          <ListeAvis
            resume={avis}
            moiId={moi.id}
            suite={`/etudiants/${id}`}
            vide={cEstMoi ? "Pas encore d'avis." : "Pas encore d'avis. Après un coup de main, tu pourras laisser le premier depuis tes demandes."}
          />
        </div>
      </div>
    </EcranConnecte>
  );
}
