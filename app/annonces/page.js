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

export default async function Annonces({ searchParams }) {
  const filtres = lireFiltres(await searchParams);
  const profil = await profilConnecte();
  const idsFavoris = await chargerIdsFavoris();
  const { annonces, encore, erreur } = await chargerFil(filtres, profil, idsFavoris);
  const filtre = Boolean(filtres.q || filtres.type || filtres.categorie || filtres.campus || filtres.photo || filtres.periode);
  const [titreVide, texteVide] = filtre
    ? ["Rien ne correspond", "Essaie un autre mot ou enlève un filtre."]
    : VIDES[filtres.vue] ?? ["Aucune annonce pour l'instant", "Lance-toi : la première annonce du campus, c'est peut-être la tienne."];

  return (
    <EcranConnecte titre="Annonces" sousTitre="Ce que le campus propose et cherche." onglet="annonces">
      <Filtres filtres={filtres} />
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
      <div className="fil">
        {annonces.map((a, i) => {
          const moi = a.auteur === profil?.id;
          const favori = idsFavoris.has(a.id);
          return (
            <CarteAnnonce
              key={a.id}
              index={i}
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
      {encore && (
        <Bouton href={lienFil(filtres, { page: filtres.page + 1 })} variante="secondaire" scroll={false}>
          Voir plus
        </Bouton>
      )}
    </EcranConnecte>
  );
}
