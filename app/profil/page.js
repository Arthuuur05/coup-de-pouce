import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Initiale from "../../components/ui/Initiale";
import Link from "next/link";
import FormProfil from "../../components/compte/FormProfil";
import { FormMotDePasse, FormEmail } from "../../components/compte/FormSecurite";
import FormSupprimerCompte from "../../components/compte/FormSupprimerCompte";
import { profilConnecte } from "../../lib/profil";
import { deconnecter } from "../../lib/actions/compte";
import CarteAnnonce from "../../components/ui/CarteAnnonce";
import Bouton from "../../components/ui/Bouton";
import Message from "../../components/ui/Message";
import { chargerMesAnnonces } from "../../lib/donnees-annonces";
import { etatAnnonce, dateRelative, estEnLigne, MAX_EN_LIGNE } from "../../lib/annonces";

export const metadata = { title: "Mon profil · Coup de Pouce" };

export default async function Profil({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/profil");
  const { prenom, nom, filiere, annee, campus, email } = profil;
  const mesAnnonces = await chargerMesAnnonces(profil.id);
  const enLigne = mesAnnonces.filter(estEnLigne).length;

  return (
    <EcranConnecte titre="Mon profil" onglet="profil">
      <div className="deux-colonnes">
        <aside className="carte carte--ombre-rouge fiche-profil">
          <Initiale prenom={prenom} grande />
          <div style={{ minWidth: 0 }}>
            <h3>{prenom || "Sans prénom"}</h3>
            <div className="carte__date" style={{ overflowWrap: "anywhere" }}>
              {email}
            </div>
            {(filiere || annee) && (
              <div style={{ fontWeight: 700, fontSize: 14 }}>{[filiere, annee].filter(Boolean).join(" · ")}</div>
            )}
            {campus && <div style={{ fontSize: 14 }}>Campus {campus}</div>}
          </div>
          <form action={deconnecter} className="seulement-ordi">
            <button type="submit" className="bouton bouton--danger" style={{ width: "100%" }}>
              Me déconnecter
            </button>
          </form>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2>Mes infos</h2>
          <FormProfil profil={{ prenom, nom, filiere, annee, campus }} />

          <div className="titre-section" id="mes-annonces">
            <h2>Mes annonces</h2>
            <span className="carte__date">
              {enLigne}/{MAX_EN_LIGNE} en ligne
            </span>
          </div>
          {retour.annonce === "supprimee" && <Message type="ok">Ton annonce est supprimée.</Message>}
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
                <CarteAnnonce
                  key={a.id}
                  index={i}
                  type={a.type}
                  categorie={a.categorie}
                  titre={a.titre}
                  auteur={`Publiée ${dateRelative(a.cree_le)}`}
                  etat={etatAnnonce(a)}
                  href={`/annonces/${a.id}`}
                />
              ))}
            </div>
          )}
          <EtatVide titre="Bientôt ici">
            Photo de profil (lot 4), coordonnées privées (lot 5), compétences depuis le CV (lot 6).
          </EtatVide>

          <h2 style={{ marginTop: 16 }}>Sécurité</h2>
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
