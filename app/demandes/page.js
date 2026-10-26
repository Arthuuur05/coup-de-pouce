import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Message from "../../components/ui/Message";
import Bouton from "../../components/ui/Bouton";
import PucesFiltre from "../../components/ui/PucesFiltre";
import CarteDemande from "../../components/demandes/CarteDemande";
import { profilConnecte } from "../../lib/profil";
import { chargerMesDemandes, chargerMesCoordonnees } from "../../lib/donnees-demandes";
import { aDesCoordonnees } from "../../lib/demandes";
import { chargerDemandesNotees, chargerCompetencesDe } from "../../lib/donnees-competences";

export const metadata = { title: "Demandes · Coup de Pouce" };

const MESSAGES = {
  acceptee: ["ok", "C'est fait ! Vous voyez maintenant les coordonnées l'un de l'autre."],
  refusee: ["ok", "Demande refusée. Cette personne ne verra pas tes coordonnées."],
  retiree: ["ok", "Accord retiré : vos coordonnées sont de nouveau cachées."],
};

// Filtre par état (?statut=…) : les demandes à traiter, les accords, les refus.
const FILTRES = {
  attente: ["En attente", ["en_attente"]],
  acceptees: ["Acceptées", ["acceptee"]],
  terminees: ["Refusées ou retirées", ["refusee", "retiree"]],
};

// Les en attente d'abord, puis les plus récentes.
const ordre = (a, b) =>
  (a.statut === "en_attente" ? 0 : 1) - (b.statut === "en_attente" ? 0 : 1) || b.cree_le.localeCompare(a.cree_le);

export default async function Demandes({ searchParams }) {
  const retour = await searchParams;
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/demandes");
  const [demandes, mesCoordonnees, notees] = await Promise.all([
    chargerMesDemandes(),
    chargerMesCoordonnees(profil.id),
    chargerDemandesNotees(profil.id),
  ]);
  // Pour un avis : les compétences de l'autre personne, à confirmer.
  const competences = await chargerCompetencesDe(demandes.filter((d) => ["acceptee", "retiree"].includes(d.statut)).map((d) => d.autre));

  const onglet = retour.onglet === "envoyees" ? "envoyees" : "recues";
  const recues = demandes.filter((d) => d.sens === "recue").sort(ordre);
  const envoyees = demandes.filter((d) => d.sens === "envoyee").sort(ordre);
  const parOnglet = onglet === "recues" ? recues : envoyees;
  const statut = FILTRES[retour.statut] ? retour.statut : "";
  const liste = statut ? parOnglet.filter((d) => FILTRES[statut][1].includes(d.statut)) : parOnglet;
  const lienStatut = (v) => `/demandes?${new URLSearchParams({ ...(onglet === "envoyees" && { onglet }), ...(v && { statut: v }) })}`.replace(/\?$/, "");
  const enAttente = recues.filter((d) => d.statut === "en_attente").length;
  const message = MESSAGES[retour.reponse];

  return (
    <EcranConnecte titre="Demandes" sousTitre="Qui veut ton contact, et à qui tu as demandé le sien." onglet="demandes">
      <nav className="filtres__puces" aria-label="Demandes reçues ou envoyées">
        <Link href="/demandes" className={`puce${onglet === "recues" ? " puce--active" : ""}`} aria-current={onglet === "recues" ? "page" : undefined}>
          Reçues ({recues.length}){enAttente > 0 && <span className="pastille pastille--puce" aria-label={`dont ${enAttente} en attente`}>{enAttente}</span>}
        </Link>
        <Link
          href="/demandes?onglet=envoyees"
          className={`puce${onglet === "envoyees" ? " puce--active" : ""}`}
          aria-current={onglet === "envoyees" ? "page" : undefined}
        >
          Envoyées ({envoyees.length})
        </Link>
        <Link href="/messages" className="puce">
          Messages
        </Link>
        <Link href="/calendrier" className="puce">
          Calendrier
        </Link>
      </nav>

      {parOnglet.length > 0 && (
        <div className="filtres filtres--compact">
          <PucesFiltre
            nom="Filtrer les demandes par état"
            actif={statut}
            lien={lienStatut}
            options={[
              ["", "Toutes", parOnglet.length],
              ...Object.entries(FILTRES).map(([cle, [label, statuts]]) => [cle, label, parOnglet.filter((d) => statuts.includes(d.statut)).length]),
            ]}
          />
        </div>
      )}

      {message && <Message type={message[0]}>{message[1]}</Message>}
      {retour.erreur && <Message>Cette demande a déjà reçu une réponse ou n'existe plus.</Message>}
      {retour.annulee && <Message type="ok">Ta demande est annulée.</Message>}
      {!aDesCoordonnees(mesCoordonnees) && demandes.length > 0 && (
        <Message type="ok">
          Tu n'as pas encore rempli tes coordonnées : après un accord, l'autre n'aura aucun moyen de te joindre.{" "}
          <Link href="/profil#mes-coordonnees">Les remplir</Link>
        </Message>
      )}

      {liste.length === 0 ? (
        statut ? (
          <EtatVide titre="Aucune demande dans cet état">
            <Link href={lienStatut("")}>Voir toutes les demandes</Link>
          </EtatVide>
        ) : onglet === "recues" ? (
          <EtatVide titre="Aucune demande reçue">
            Quand quelqu'un demandera ton contact sur une de tes annonces, ça arrivera ici.
          </EtatVide>
        ) : (
          <EtatVide titre="Aucune demande envoyée">
            <p style={{ margin: "0 0 12px" }}>Trouve une annonce qui te plaît et touche « Demander le contact » ou « Je peux t'aider ».</p>
            <Bouton href="/annonces" variante="accent">
              Voir les annonces
            </Bouton>
          </EtatVide>
        )
      ) : (
        <div className="demandes">
          {liste.map((d) => (
            <CarteDemande key={d.id} demande={d} avisDonne={notees.has(d.id)} competences={competences[d.autre] ?? []} />
          ))}
        </div>
      )}
    </EcranConnecte>
  );
}
