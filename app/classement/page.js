import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Initiale from "../../components/ui/Initiale";
import PucesFiltre from "../../components/ui/PucesFiltre";
import { profilConnecte } from "../../lib/profil";
import { chargerClassement, chargerReglageClassement } from "../../lib/donnees-classement";

export const metadata = { title: "Classement du campus · Coup de Pouce" };

const MEDAILLES = ["🥇", "🥈", "🥉"];

const nomDuMois = (decalage) => {
  const maintenant = new Date();
  const date = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - decalage, 15));
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
};

function lien(mois, campus) {
  const params = new URLSearchParams();
  if (mois) params.set("mois", mois);
  if (campus) params.set("campus", campus);
  const texte = params.toString();
  return `/classement${texte ? `?${texte}` : ""}`;
}

// Les étudiants les plus serviables du mois : des coups de pouce rendus, sans rien de privé.
export default async function Classement({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/classement");
  const un = (v) => (Array.isArray(v) ? v[0] : v) ?? "";
  const mois = un(retour.mois) === "precedent" ? "precedent" : "";
  const monCampus = profil.campus || "";
  const campus = un(retour.campus) === "mon" && monCampus ? monCampus : "";
  const [lignes, reglage] = await Promise.all([chargerClassement(mois ? 1 : 0, campus), chargerReglageClassement(profil.id)]);
  const ouverts = lignes ? lignes.filter((l) => l.rang <= 10) : [];
  const moi = lignes?.find((l) => l.moi);

  return (
    <EcranConnecte titre="Classement du campus" sousTitre="Les étudiants les plus serviables du mois. Pour s'encourager, pas pour se comparer." onglet="profil">
      <PucesFiltre
        nom="Choisir le mois"
        actif={mois}
        lien={(v) => lien(v, retour.campus ? un(retour.campus) : "")}
        options={[
          ["", `Ce mois-ci (${nomDuMois(0)})`],
          ["precedent", `Le mois dernier (${nomDuMois(1)})`],
        ]}
      />
      {monCampus && (
        <PucesFiltre
          nom="Choisir le campus"
          actif={campus ? "mon" : ""}
          lien={(v) => lien(mois, v)}
          options={[
            ["", "Tous les campus"],
            ["mon", `Mon campus (${monCampus})`],
          ]}
        />
      )}

      {lignes === null ? (
        <EtatVide titre="Classement indisponible">Il n'est pas encore prêt. Reviens un peu plus tard.</EtatVide>
      ) : ouverts.length === 0 ? (
        <EtatVide titre="Personne pour l'instant">
          <p style={{ margin: "0 0 12px" }}>
            {mois ? "Aucun coup de pouce enregistré le mois dernier." : "Aucun coup de pouce rendu ce mois-ci : tu peux être le premier."}
          </p>
          {!mois && <Link href="/annonces">Voir les annonces</Link>}
        </EtatVide>
      ) : (
        <ol className="classement">
          {ouverts.map((l) => (
            <li key={l.personne} className={`classement__ligne${l.rang <= 3 ? " classement__ligne--podium" : ""}${l.moi ? " classement__ligne--moi" : ""}`}>
              <span className="classement__rang" aria-label={`Place ${l.rang}`}>
                {MEDAILLES[l.rang - 1] ?? l.rang}
              </span>
              <Initiale prenom={l.prenom} photo={l.photoUrl} />
              <Link href={`/etudiants/${l.personne}`} className="classement__nom">
                {l.prenom || "Un étudiant"}
                {l.moi && " (toi)"}
                {l.campus && <span className="carte__date"> · {l.campus}</span>}
              </Link>
              <span className="classement__coups">
                {l.coups} <span className="carte__date">coup{l.coups > 1 ? "s" : ""} de pouce</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {lignes && moi && moi.rang > 10 && (
        <p className="classement__ma-place">
          Ta place : <strong>{moi.rang}</strong> avec {moi.coups} coup{moi.coups > 1 ? "s" : ""} de pouce.
        </p>
      )}
      {lignes && !moi && reglage !== false && !mois && (
        <p className="champ__aide" style={{ margin: 0 }}>
          Tu n'as pas encore rendu de coup de pouce ce mois-ci : un accord sur une de tes annonces te fait entrer au classement.
        </p>
      )}
      {reglage === false && (
        <p className="champ__aide" style={{ margin: 0 }}>
          Tu as choisi de ne pas apparaître. Tu peux changer d'avis dans <Link href="/profil#mes-infos">Mon profil</Link>.
        </p>
      )}
    </EcranConnecte>
  );
}
