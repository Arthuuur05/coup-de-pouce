import Link from "next/link";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Bouton from "../../components/ui/Bouton";
import Message from "../../components/ui/Message";
import CarteAnnonce from "../../components/ui/CarteAnnonce";
import Filtres, { lienFil } from "../../components/annonces/Filtres";
import { profilConnecte } from "../../lib/profil";
import { chargerFil, chargerIdsFavoris } from "../../lib/donnees-annonces";
import { basculerFavori } from "../../lib/actions/annonces";
import { TYPES, CATEGORIES, signature, dateRelative } from "../../lib/annonces";
import { CAMPUS } from "../../lib/compte";
import { ALERTES_MAX } from "../../lib/alertes";

export const metadata = { title: "Annonces · Coup de Pouce" };

const VUES = ["pour-toi", "favoris"];
const PERIODES = [1, 7, 30];

// Ne garde que les valeurs connues : une adresse bricolée ne casse pas la page.
function lireFiltres(p) {
  const un = (v) => (Array.isArray(v) ? v[0] : v) ?? "";
  const page = Number.parseInt(un(p.page), 10);
  return {
    q: un(p.q).slice(0, 60),
    type: TYPES[un(p.type)] ? un(p.type) : "",
    categorie: CATEGORIES.includes(un(p.categorie)) ? un(p.categorie) : "",
    campus: CAMPUS.includes(un(p.campus)) ? un(p.campus) : "",
    vue: VUES.includes(un(p.vue)) ? un(p.vue) : "",
    tri: un(p.tri) === "bientot" ? "bientot" : "",
    photo: un(p.photo) === "1" ? "1" : "",
    periode: PERIODES.includes(Number(un(p.periode))) ? Number(un(p.periode)) : 0,
    page: page > 1 && page < 50 ? page : 1,
  };
}

const extrait = (texte) => (texte.length > 120 ? `${texte.slice(0, 117).trimEnd()}…` : texte);

const VIDES = {
  "pour-toi": ["Rien pour toi pour l'instant", "Personne de ton campus ou de ta filière n'a encore publié. Regarde tout le campus."],
  favoris: ["Pas encore de favori", "Touche le cœur d'une annonce pour la retrouver ici."],
};

const ALERTE = {
  creee: ["ok", "C'est noté : tu seras prévenu des nouvelles annonces qui correspondent. Tu retrouves tes alertes dans Notifications."],
  existe: ["ok", "Tu as déjà cette alerte."],
  limite: ["erreur", `Tu as déjà ${ALERTES_MAX} alertes. Supprime-en une dans Notifications pour en ajouter une.`],
  vide: ["erreur", "Choisis au moins un filtre ou un mot avant de créer une alerte."],
  erreur: ["erreur", "L'alerte n'a pas pu être créée. Réessaie dans un instant."],
};

export default async function Annonces({ searchParams }) {
  const brut = await searchParams;
  const filtres = lireFiltres(brut);
  const alerte = ALERTE[brut.alerte];
  const profil = await profilConnecte();
  const idsFavoris = await chargerIdsFavoris();
  const { annonces, encore, erreur } = await chargerFil(filtres, profil, idsFavoris);
  const filtre = Boolean(filtres.q || filtres.type || filtres.categorie || filtres.campus || filtres.photo || filtres.periode);
  const [titreVide, texteVide] = filtre
    ? ["Rien ne correspond", "Essaie un autre mot ou enlève un filtre."]
    : VIDES[filtres.vue] ?? ["Aucune annonce pour l'instant", "Lance-toi : la première annonce du campus, c'est peut-être la tienne."];

  // Mes échanges (à traiter, acceptés, en attente) d'abord, puis le reste à découvrir. Seulement s'il y a les deux.
  const echanges = annonces.filter((a) => a.echange && a.echange.cle !== "close").sort((a, b) => a.echange.ordre - b.echange.ordre);
  const autres = annonces.filter((a) => !echanges.includes(a));
  const groupes = echanges.length && autres.length
    ? [
        { titre: "Tes échanges en cours", liste: echanges, debut: 0 },
        { titre: "À découvrir", liste: autres, debut: echanges.length },
      ]
    : [{ titre: null, liste: annonces, debut: 0 }];

  return (
    <EcranConnecte titre="Annonces" sousTitre="Ce que le campus propose et cherche." onglet="annonces">
      {alerte && <Message type={alerte[0]}>{alerte[1]}</Message>}
      <Filtres filtres={filtres} />
      <p className="champ__aide" style={{ margin: 0 }}>
        Pas sûr de ce que tu cherches ? <Link href="/assistant">Demande à l'assistant</Link>.
      </p>
      {erreur && <Message>Les annonces n'ont pas pu être chargées. Recharge la page dans un instant.</Message>}
      {!erreur && annonces.length > 0 && (
        <p className="fil__compte">
          {annonces.length}
          {encore ? "+" : ""} annonce{annonces.length > 1 ? "s" : ""}
          {filtres.vue === "pour-toi" ? " de ton campus ou de ta filière" : ""}
          {filtres.vue === "favoris" ? " en favori" : ""}
        </p>
      )}
      {!erreur && annonces.length === 0 && (
        <EtatVide titre={titreVide}>
          <p style={{ margin: "0 0 12px" }}>{texteVide}</p>
          {filtre || filtres.vue ? (
            <Bouton href="/annonces" variante="secondaire">
              Voir tout le campus
            </Bouton>
          ) : (
            <Bouton href="/publier" variante="accent">
              Publier une annonce
            </Bouton>
          )}
        </EtatVide>
      )}
      {groupes.map(({ titre, liste, debut }) => (
      <section key={titre ?? "tout"} className="fil__groupe">
        {titre && <h2 className="fil__groupe-titre">{titre}</h2>}
      <div className="fil">
        {liste.map((a, j) => {
          const i = debut + j;
          const moi = a.auteur === profil?.id;
          const favori = idsFavoris.has(a.id);
          return (
            <CarteAnnonce
              key={a.id}
              index={i}
              echange={a.echange}
              type={a.type}
              categorie={a.categorie}
              titre={a.titre}
              extrait={extrait(a.description)}
              photo={a.photoUrl}
              avatar={a.auteurProfil && { prenom: a.auteurProfil.prenom, photoUrl: a.auteurProfil.photoUrl }}
              auteur={moi ? "Toi" : signature(a.auteurProfil)}
              date={dateRelative(a.cree_le)}
              href={`/annonces/${a.id}`}
              favori={favori}
              actionFavori={moi ? undefined : basculerFavori.bind(null, a.id, favori)}
            />
          );
        })}
      </div>
      </section>
      ))}
      {encore && (
        <Bouton href={lienFil(filtres, { page: filtres.page + 1 })} variante="secondaire" scroll={false}>
          Voir plus
        </Bouton>
      )}
    </EcranConnecte>
  );
}
