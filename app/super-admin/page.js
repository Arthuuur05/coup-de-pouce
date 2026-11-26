import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import Message from "../../components/ui/Message";
import PucesFiltre from "../../components/ui/PucesFiltre";
import { profilConnecte } from "../../lib/profil";
import { chargerTableauDeBord, chargerJournal } from "../../lib/donnees-super-admin";

export const metadata = { title: "Super admin · Coup de Pouce" };

const NIVEAUX = { erreur: "Erreurs", alerte: "Alertes", info: "Infos" };
const pourcent = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");
const heure = (iso) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

function Chiffre({ valeur, label, detail, alerte = false }) {
  return (
    <div className={`carte ${alerte ? "carte--ombre-rouge" : "carte--ombre-noire"} chiffre`}>
      <span className="chiffre__valeur">{valeur}</span>
      <span className="chiffre__label">{label}</span>
      {detail && <span className="carte__date">{detail}</span>}
    </div>
  );
}

// Le tableau de bord du super admin : 5 chiffres clés, qui est en ligne, et le journal des erreurs.
export default async function SuperAdmin({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (profil?.role !== "super_admin") redirect("/annonces");
  const niveau = NIVEAUX[retour.niveau] ? retour.niveau : "";
  const [{ tableau: t, erreur }, journal] = await Promise.all([chargerTableauDeBord(), chargerJournal(niveau)]);

  return (
    <EcranConnecte titre="Super admin" sousTitre="Ce qui se passe sur Coup de Pouce, en direct." onglet="profil">
      {erreur || !t ? (
        <Message>Le tableau de bord n'a pas pu être chargé. La migration « super_admin » est-elle appliquée ?</Message>
      ) : (
        <>
          <div className="chiffres">
            <Chiffre valeur={t.connectes} label="Connectés maintenant" detail={`${t.actifs_24h} actifs sur 24 h`} />
            <Chiffre valeur={pourcent(t.actifs_7j, t.inscrits)} label="Actifs sur 7 jours" detail={`${t.actifs_7j} sur ${t.inscrits} inscrits · +${t.inscrits_7j} cette semaine`} />
            <Chiffre valeur={t.annonces_en_ligne} label="Annonces en ligne" detail={`+${t.annonces_7j} cette semaine`} />
            <Chiffre
              valeur={pourcent(t.acceptees_7j, t.acceptees_7j + t.refusees_7j)}
              label="Demandes acceptées (7 j)"
              detail={`${t.demandes_7j} demandes cette semaine`}
            />
            <Chiffre valeur={t.erreurs_24h} label="Erreurs sur 24 h" detail={`${t.erreurs_7j} sur 7 jours`} alerte={t.erreurs_24h > 0} />
          </div>

          <h2>En ligne (15 dernières minutes)</h2>
          {t.en_ligne.length === 0 ? (
            <p className="carte__date" style={{ margin: 0 }}>Personne pour l'instant.</p>
          ) : (
            <ul className="en-ligne">
              {t.en_ligne.map((p, i) => (
                <li key={i}>
                  <strong>{p.prenom || "Sans prénom"}</strong>
                  {p.role !== "etudiant" && <span className="fiche-profil__role">{p.role === "super_admin" ? "Super admin" : "Intervenant·e"}</span>}
                  <span className="carte__date">vu à {heure(p.vu_le).slice(-5)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h2>Journal</h2>
      <PucesFiltre
        nom="Filtrer le journal par niveau"
        actif={niveau}
        lien={(v) => (v ? `/super-admin?niveau=${v}` : "/super-admin")}
        options={[["", "Tout"], ...Object.entries(NIVEAUX)]}
      />
      {journal.length === 0 ? (
        <p className="carte__date" style={{ margin: 0 }}>Rien dans le journal : tout va bien.</p>
      ) : (
        <ul className="journal">
          {journal.map((l) => (
            <li key={l.id} className={`journal__ligne journal__ligne--${l.niveau}`}>
              <div className="journal__haut">
                <strong>{l.niveau.toUpperCase()}</strong>
                <span className="carte__date">
                  {heure(l.cree_le)} · {l.source}
                  {l.chemin ? ` · ${l.chemin}` : ""}
                </span>
              </div>
              <p className="journal__message">{l.message || "(sans message)"}</p>
            </li>
          ))}
        </ul>
      )}
    </EcranConnecte>
  );
}
