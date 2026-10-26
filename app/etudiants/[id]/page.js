import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import EtatVide from "../../../components/ui/EtatVide";
import Initiale from "../../../components/ui/Initiale";
import CarteAnnonce from "../../../components/ui/CarteAnnonce";
import { profilConnecte } from "../../../lib/profil";
import { chargerProfilPublic, chargerIdsFavoris } from "../../../lib/donnees-annonces";
import { basculerFavori } from "../../../lib/actions/annonces";
import { dateRelative } from "../../../lib/annonces";

export const metadata = { title: "Profil · Coup de Pouce" };

// Ce que les autres étudiants voient de quelqu'un : photo, prénom, filière, année, campus et annonces en ligne.
// Jamais le nom de famille, l'e-mail ni les annonces réglées ou expirées.
export default async function ProfilPublic({ params }) {
  const { id } = await params;
  const moi = await profilConnecte();
  if (!moi) redirect(`/connexion?suite=/etudiants/${id}`);
  const [donnees, favoris] = await Promise.all([chargerProfilPublic(id), chargerIdsFavoris()]);
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
          </div>
        </aside>

        <div className="profil__contenu">
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
        </div>
      </div>
    </EcranConnecte>
  );
}
