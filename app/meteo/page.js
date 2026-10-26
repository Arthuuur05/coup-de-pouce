import Link from "next/link";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import BandeauMeteo from "../../components/ui/BandeauMeteo";
import Besoins from "../../components/meteo/Besoins";
import { profilConnecte } from "../../lib/profil";
import { chargerBulletinPublie } from "../../lib/donnees-meteo";
import { dateLongue } from "../../lib/meteo";

export const metadata = { title: "Météo du campus · Coup de Pouce" };

export default async function Meteo() {
  const [profil, bulletin] = await Promise.all([profilConnecte(), chargerBulletinPublie()]);
  return (
    <EcranConnecte titre="Météo du campus" sousTitre="Ce dont le campus a besoin cette semaine." onglet="meteo">
      {bulletin ? (
        <>
          <BandeauMeteo>{bulletin.titre}</BandeauMeteo>
          <p className="carte__date" style={{ margin: 0 }}>
            Semaine du {dateLongue(bulletin.semaine)}
          </p>
          <p className="meteo__bulletin">{bulletin.texte}</p>
          {bulletin.besoins.length > 0 && (
            <>
              <h2>Top {bulletin.besoins.length} des besoins</h2>
              <Besoins besoins={bulletin.besoins} />
            </>
          )}
        </>
      ) : (
        <>
          <BandeauMeteo>Premier bulletin bientôt</BandeauMeteo>
          <EtatVide titre="Pas encore de bulletin">Le bulletin de la semaine arrive : reviens bientôt.</EtatVide>
        </>
      )}
      {profil?.est_admin && (
        <Link href="/admin/meteo" className="bouton bouton--secondaire" style={{ alignSelf: "flex-start" }}>
          Relire le bulletin
        </Link>
      )}
    </EcranConnecte>
  );
}
