import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Initiale from "../../components/ui/Initiale";
import { profilConnecte } from "../../lib/profil";
import { chargerMesRendezVous } from "../../lib/donnees-calendrier";
import { cleJour, jourSeul, dans, heureSeule } from "../../lib/calendrier";

export const metadata = { title: "Calendrier · Coup de Pouce" };

// Mes rendez-vous de coups de pouce, jour par jour. Se remplit depuis une demande acceptée.
export default async function Calendrier({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/calendrier");
  const tous = await chargerMesRendezVous();
  const passes = retour.vue === "passes";
  const maintenant = Date.now();
  const liste = (tous ?? []).filter((r) => (new Date(r.quand).getTime() >= maintenant) !== passes);
  if (passes) liste.reverse();
  const jours = [];
  for (const r of liste) {
    const cle = cleJour(r.quand);
    const dernier = jours[jours.length - 1];
    if (dernier?.cle === cle) dernier.rdv.push(r);
    else jours.push({ cle, titre: jourSeul(r.quand), rdv: [r] });
  }
  const nbPasses = (tous ?? []).filter((r) => new Date(r.quand).getTime() < maintenant).length;

  return (
    <EcranConnecte titre="Calendrier" sousTitre="Tes rendez-vous de coups de pouce. Tu es prévenu la veille." onglet="demandes">
      <nav className="filtres__puces" aria-label="Rendez-vous à venir ou passés">
        <Link href="/calendrier" className={`puce${passes ? "" : " puce--active"}`} aria-current={passes ? undefined : "true"}>
          À venir
        </Link>
        <Link href="/calendrier?vue=passes" className={`puce${passes ? " puce--active" : ""}`} aria-current={passes ? "true" : undefined}>
          Passés{nbPasses > 0 && <span className="puce__nombre">{nbPasses}</span>}
        </Link>
        <Link href="/demandes" className="puce">
          Demandes
        </Link>
      </nav>

      {tous === null ? (
        <EtatVide titre="Calendrier indisponible">Il n'est pas encore prêt. Reviens un peu plus tard.</EtatVide>
      ) : jours.length === 0 ? (
        <EtatVide titre={passes ? "Aucun rendez-vous passé" : "Aucun rendez-vous à venir"}>
          {!passes && (
            <>
              <p style={{ margin: "0 0 12px" }}>Quand une demande est acceptée, l'un de vous peut fixer une date depuis « Demandes ».</p>
              <Link href="/demandes?statut=acceptees" className="bouton bouton--secondaire">
                Voir mes demandes acceptées
              </Link>
            </>
          )}
        </EtatVide>
      ) : (
        <div className="agenda">
          {jours.map((j) => (
            <section key={j.cle} className="agenda__jour" aria-label={j.titre}>
              <h2 className="agenda__titre">{j.titre}</h2>
              <ul className="agenda__liste">
                {j.rdv.map((r) => (
                  <li key={r.demande} className="agenda__rdv">
                    <span className="agenda__heure">{heureSeule(r.quand)}</span>
                    <Initiale prenom={r.autreProfil?.prenom} photo={r.autreProfil?.photoUrl} />
                    <span className="agenda__texte">
                      <strong>{r.titre}</strong>
                      <span className="carte__date">
                        avec {r.autreProfil?.prenom || "un étudiant"}
                        {r.lieu ? ` · 📍 ${r.lieu}` : ""}
                        {!passes ? ` · ${dans(r.quand, maintenant)}` : ""}
                      </span>
                    </span>
                    <span className="agenda__actions">
                      {!passes && (
                        <a href={`/calendrier/ics?demande=${r.demande}`} className="bouton bouton--secondaire demande__petit">
                          Agenda
                        </a>
                      )}
                      <Link href={`/demandes?${r.sens === "envoyee" ? "onglet=envoyees&" : ""}statut=acceptees#demande-${r.demande}`} className="bouton bouton--secondaire demande__petit">
                        Gérer
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </EcranConnecte>
  );
}
