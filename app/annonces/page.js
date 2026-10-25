import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Bouton from "../../components/ui/Bouton";
import Message from "../../components/ui/Message";
import CarteAnnonce from "../../components/ui/CarteAnnonce";
import Filtres from "../../components/annonces/Filtres";
import { profilConnecte } from "../../lib/profil";
import { chargerFil } from "../../lib/donnees-annonces";
import { TYPES, CATEGORIES, signature, dateRelative } from "../../lib/annonces";
import { CAMPUS } from "../../lib/compte";

export const metadata = { title: "Annonces · Coup de Pouce" };

// Ne garde que les valeurs connues : une adresse bricolée ne casse pas la page.
function lireFiltres(p) {
  const un = (v) => (Array.isArray(v) ? v[0] : v) ?? "";
  return {
    q: un(p.q).slice(0, 60),
    type: TYPES[un(p.type)] ? un(p.type) : "",
    categorie: CATEGORIES.includes(un(p.categorie)) ? un(p.categorie) : "",
    campus: CAMPUS.includes(un(p.campus)) ? un(p.campus) : "",
    vue: un(p.vue) === "pour-toi" ? "pour-toi" : "",
  };
}

const extrait = (texte) => (texte.length > 120 ? `${texte.slice(0, 117).trimEnd()}…` : texte);

export default async function Annonces({ searchParams }) {
  const filtres = lireFiltres(await searchParams);
  const profil = await profilConnecte();
  const { annonces, erreur } = await chargerFil({ ...filtres, pourToi: filtres.vue === "pour-toi" }, profil);
  const filtre = Boolean(filtres.q || filtres.type || filtres.categorie || filtres.campus || filtres.vue);

  return (
    <EcranConnecte titre="Annonces" sousTitre="Ce que le campus propose et cherche." onglet="annonces">
      <Filtres filtres={filtres} />
      {erreur && <Message>Les annonces n'ont pas pu être chargées. Recharge la page dans un instant.</Message>}
      {!erreur && annonces.length > 0 && (
        <p className="fil__compte">
          {annonces.length} annonce{annonces.length > 1 ? "s" : ""}
          {filtres.vue === "pour-toi" ? " de ton campus ou de ta filière" : ""}
        </p>
      )}
      {!erreur && annonces.length === 0 && (
        <EtatVide titre={filtre ? "Rien ne correspond" : "Aucune annonce pour l'instant"}>
          <p style={{ margin: "0 0 12px" }}>
            {filtre ? "Essaie un autre mot ou enlève un filtre." : "Lance-toi : la première annonce du campus, c'est peut-être la tienne."}
          </p>
          <Bouton href={filtre ? "/annonces" : "/publier"} variante={filtre ? "secondaire" : "accent"}>
            {filtre ? "Effacer les filtres" : "Publier une annonce"}
          </Bouton>
        </EtatVide>
      )}
      <div className="fil">
        {annonces.map((a, i) => (
          <CarteAnnonce
            key={a.id}
            index={i}
            type={a.type}
            categorie={a.categorie}
            titre={a.titre}
            extrait={extrait(a.description)}
            auteur={signature(a.auteurProfil)}
            date={dateRelative(a.cree_le)}
            href={`/annonces/${a.id}`}
          />
        ))}
      </div>
    </EcranConnecte>
  );
}
