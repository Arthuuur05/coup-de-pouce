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

export const metadata = { title: "Mon profil · Coup de Pouce" };

export default async function Profil() {
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/profil");
  const { prenom, nom, filiere, annee, campus, email } = profil;

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
          <EtatVide titre="Bientôt ici">
            Photo de profil et mes annonces (lot 4), coordonnées privées (lot 5), compétences depuis le CV (lot 6).
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
