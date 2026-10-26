import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Initiale from "../../components/ui/Initiale";
import CarteAnnonce from "../../components/ui/CarteAnnonce";
import Bouton from "../../components/ui/Bouton";
import Message from "../../components/ui/Message";
import FormProfil from "../../components/compte/FormProfil";
import FormPhotoProfil from "../../components/compte/FormPhotoProfil";
import { FormMotDePasse, FormEmail } from "../../components/compte/FormSecurite";
import FormSupprimerCompte from "../../components/compte/FormSupprimerCompte";
import FormCoordonnees from "../../components/demandes/FormCoordonnees";
import FormCompetences from "../../components/competences/FormCompetences";
import FormCv from "../../components/competences/FormCv";
import ListeAvis from "../../components/competences/ListeAvis";
import { profilConnecte } from "../../lib/profil";
import { deconnecter } from "../../lib/actions/compte";
import { remettreEnLigne, basculerFavori } from "../../lib/actions/annonces";
import { chargerMesAnnonces, chargerMesFavoris, adresseMaPhoto } from "../../lib/donnees-annonces";
import { chargerMesCoordonnees } from "../../lib/donnees-demandes";
import { chargerCompetences, chargerAvis, chargerCv } from "../../lib/donnees-competences";
import { etatAnnonce, dateRelative, estEnLigne, expireBientot, MAX_EN_LIGNE } from "../../lib/annonces";

export const metadata = { title: "Mon profil · Coup de Pouce" };

const MESSAGES = {
  supprimee: ["ok", "Ton annonce est supprimée."],
  prolongee: ["ok", "Ton annonce est prolongée de 30 jours."],
  limite: ["erreur", `Tu as déjà ${MAX_EN_LIGNE} annonces en ligne : marque-en une « C'est réglé » d'abord.`],
};

export default async function Profil({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/profil");
  const { prenom, nom, filiere, annee, campus, email } = profil;
  const [mesAnnonces, mesFavoris, photo, mesCoordonnees, mesCompetences, mesAvis, monCv] = await Promise.all([
    chargerMesAnnonces(profil.id),
    chargerMesFavoris(),
    adresseMaPhoto(profil.photo),
    chargerMesCoordonnees(profil.id),
    chargerCompetences(profil.id),
    chargerAvis(profil.id),
    chargerCv(profil.id),
  ]);
  const enLigne = mesAnnonces.filter(estEnLigne).length;
  const message = MESSAGES[retour.annonce];

  return (
    <EcranConnecte titre="Mon profil" onglet="profil">
      <div className="deux-colonnes">
        <aside className="carte carte--ombre-rouge fiche-profil">
          <Initiale prenom={prenom} photo={photo} grande />
          <div style={{ minWidth: 0 }}>
            <h3>{prenom || "Sans prénom"}</h3>
            <div className="carte__date" style={{ overflowWrap: "anywhere" }}>
              {email}
            </div>
            {(filiere || annee) && (
              <div style={{ fontWeight: 700, fontSize: 14 }}>{[filiere, annee].filter(Boolean).join(" · ")}</div>
            )}
            {campus && <div style={{ fontSize: 14 }}>Campus {campus}</div>}
            <Link href={`/etudiants/${profil.id}`} className="fiche-profil__public">
              Voir mon profil public →
            </Link>
          </div>
          <form action={deconnecter} className="seulement-ordi">
            <button type="submit" className="bouton bouton--danger" style={{ width: "100%" }}>
              Me déconnecter
            </button>
          </form>
        </aside>

        <div className="profil__contenu">
          <div className="titre-section" id="mes-annonces">
            <h2>Mes annonces</h2>
            <span className="carte__date">
              {enLigne}/{MAX_EN_LIGNE} en ligne
            </span>
          </div>
          {message && <Message type={message[0]}>{message[1]}</Message>}
          {mesAnnonces.length === 0 ? (
            <EtatVide titre="Pas encore d'annonce">
              <p style={{ margin: "0 0 12px" }}>Propose un coup de main ou demande-en un.</p>
              <Bouton href="/publier" variante="accent">
                Publier une annonce
              </Bouton>
            </EtatVide>
          ) : (
            <div className="fil fil--profil">
              {mesAnnonces.map((a, i) => (
                <div key={a.id} className="fil__case">
                  <CarteAnnonce
                    index={i}
                    type={a.type}
                    categorie={a.categorie}
                    titre={a.titre}
                    auteur={`Publiée ${dateRelative(a.cree_le)}`}
                    etat={etatAnnonce(a)}
                    href={`/annonces/${a.id}`}
                  />
                  {expireBientot(a) && (
                    <form action={remettreEnLigne.bind(null, a.id, "profil")}>
                      <button type="submit" className="bouton bouton--accent fil__prolonger">
                        Prolonger de 30 jours
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="titre-section" id="mes-favoris">
            <h2>Mes favoris</h2>
            {mesFavoris.length > 0 && <span className="carte__date">{mesFavoris.length}</span>}
          </div>
          {mesFavoris.length === 0 ? (
            <EtatVide titre="Pas encore de favori">Touche le cœur d'une annonce pour la retrouver ici.</EtatVide>
          ) : (
            <div className="fil fil--profil">
              {mesFavoris.map((f, i) => (
                <CarteAnnonce
                  key={f.id}
                  index={i}
                  type={f.type}
                  categorie={f.categorie}
                  titre={f.titre}
                  auteur={f.disponible ? `En favori ${dateRelative(f.ajoute_le)}` : "Plus disponible"}
                  href={f.disponible ? `/annonces/${f.id}` : undefined}
                  eteinte={!f.disponible}
                  favori
                  actionFavori={basculerFavori.bind(null, f.id, true)}
                />
              ))}
            </div>
          )}

          <h2 className="profil__titre">Mes infos</h2>
          <FormProfil profil={{ prenom, nom, filiere, annee, campus }} />
          <FormPhotoProfil photo={photo} />

          <div className="titre-section" id="mes-coordonnees">
            <h2>Mes coordonnées privées</h2>
            <span className="carte__date">Après accord seulement</span>
          </div>
          <FormCoordonnees coordonnees={mesCoordonnees} />

          <div className="titre-section" id="mes-competences">
            <h2>Mes compétences</h2>
            <span className="carte__date">Visibles par les étudiants</span>
          </div>
          <FormCompetences competences={mesCompetences} />

          <div className="titre-section" id="mon-cv">
            <h2>Mon CV</h2>
            <span className="carte__date">Après accord seulement</span>
          </div>
          <FormCv cv={monCv} />

          <div className="titre-section" id="mes-avis">
            <h2>Mes avis reçus</h2>
            {mesAvis.total > 0 && <span className="carte__date">{mesAvis.total}</span>}
          </div>
          <ListeAvis
            resume={mesAvis}
            moiId={profil.id}
            suite="/profil#mes-avis"
            vide="Pas encore d'avis. Après un coup de main accepté, l'autre personne pourra en laisser un."
          />

          <h2 className="profil__titre">Sécurité</h2>
          <FormMotDePasse />
          <FormEmail emailActuel={email} />

          <form action={deconnecter} className="seulement-telephone">
            <button type="submit" className="bouton bouton--danger" style={{ width: "100%" }}>
              Me déconnecter
            </button>
          </form>

          <FormSupprimerCompte />
          <p className="champ__aide" style={{ margin: 0 }}>
            <Link href="/donnees-personnelles">Ce qu'on fait de tes données personnelles</Link>
          </p>
        </div>
      </div>
    </EcranConnecte>
  );
}
