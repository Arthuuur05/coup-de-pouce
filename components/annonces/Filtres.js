import Link from "next/link";
import { TYPES, CATEGORIES } from "../../lib/annonces";
import { CAMPUS } from "../../lib/compte";
import { creerAlerte } from "../../lib/actions/alertes";

// Adresse du fil avec un filtre changé et les autres gardés (on revient à la page 1, sauf « Voir plus »).
export function lienFil(filtres, changement) {
  const suite = { ...filtres, page: 1, ...changement };
  if (suite.page === 1) delete suite.page;
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(suite)) if (valeur) params.set(cle, valeur);
  const texte = params.toString();
  return texte ? `/annonces?${texte}` : "/annonces";
}

const PERIODES = [
  [1, "Aujourd'hui"],
  [7, "7 jours"],
  [30, "30 jours"],
];

function Puce({ href, actif, children }) {
  return (
    <Link href={href} className={`puce${actif ? " puce--active" : ""}`} aria-current={actif ? "true" : undefined}>
      {children}
    </Link>
  );
}

// Filtres du fil. Tout passe par l'adresse (?q=…&type=…) : la page marche sans JavaScript et se partage.
export default function Filtres({ filtres }) {
  const { q, type, categorie, campus, vue, tri, photo, periode } = filtres;
  const actifs = Boolean(q || type || categorie || campus || vue || tri || photo || periode);
  return (
    <div className="filtres">
      <div className="filtres__puces">
        <Puce href={lienFil(filtres, { vue: "" })} actif={!vue}>
          Tout le campus
        </Puce>
        <Puce href={lienFil(filtres, { vue: "pour-toi" })} actif={vue === "pour-toi"}>
          Pour toi
        </Puce>
        <Puce href={lienFil(filtres, { vue: "favoris" })} actif={vue === "favoris"}>
          Mes favoris
        </Puce>
        <span className="filtres__separateur" aria-hidden="true" />
        {Object.entries(TYPES).map(([valeur, label]) => (
          <Puce key={valeur} href={lienFil(filtres, { type: type === valeur ? "" : valeur })} actif={type === valeur}>
            {label}
          </Puce>
        ))}
      </div>

      <div className="filtres__ligne">
        <span className="filtres__etiquette">Publiées</span>
        {PERIODES.map(([jours, label]) => (
          <Puce key={jours} href={lienFil(filtres, { periode: periode === jours ? "" : jours })} actif={periode === jours}>
            {label}
          </Puce>
        ))}
        <span className="filtres__separateur" aria-hidden="true" />
        <Puce href={lienFil(filtres, { photo: photo ? "" : "1" })} actif={Boolean(photo)}>
          Avec photo
        </Puce>
        <Puce href={lienFil(filtres, { tri: tri ? "" : "bientot" })} actif={tri === "bientot"}>
          Bientôt expirées
        </Puce>
      </div>

      <form action="/annonces" className="filtres__formulaire" role="search">
        {type && <input type="hidden" name="type" value={type} />}
        {vue && <input type="hidden" name="vue" value={vue} />}
        {tri && <input type="hidden" name="tri" value={tri} />}
        {photo && <input type="hidden" name="photo" value={photo} />}
        {periode ? <input type="hidden" name="periode" value={periode} /> : null}
        <label className="filtres__recherche">
          <span className="visuellement-cache">Rechercher un mot</span>
          <input type="search" name="q" defaultValue={q} placeholder="Rechercher : montage, stats, Lyon…" className="champ__input" maxLength={60} />
        </label>
        <label>
          <span className="visuellement-cache">Catégorie</span>
          <select name="categorie" defaultValue={categorie} className="champ__input">
            <option value="">Catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="visuellement-cache">Campus</span>
          <select name="campus" defaultValue={campus} className="champ__input">
            <option value="">Campus</option>
            {CAMPUS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="bouton bouton--principal">
          Chercher
        </button>
      </form>
      <div className="rangee">
        {Boolean(q || type || categorie || campus) && (
          <form action={creerAlerte}>
            {q && <input type="hidden" name="q" value={q} />}
            {type && <input type="hidden" name="type" value={type} />}
            {categorie && <input type="hidden" name="categorie" value={categorie} />}
            {campus && <input type="hidden" name="campus" value={campus} />}
            <button type="submit" className="bouton bouton--secondaire">
              🔔 Me prévenir
            </button>
          </form>
        )}
        {actifs && (
          <Link href="/annonces" className="filtres__effacer">
            Effacer les filtres
          </Link>
        )}
      </div>
    </div>
  );
}
