import Link from "next/link";
import { TYPES, CATEGORIES } from "../../lib/annonces";
import { CAMPUS } from "../../lib/compte";

// Adresse du fil avec un filtre changé et les autres gardés.
function lien(filtres, changement) {
  const suite = { ...filtres, ...changement };
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(suite)) if (valeur) params.set(cle, valeur);
  const texte = params.toString();
  return texte ? `/annonces?${texte}` : "/annonces";
}

function Puce({ href, actif, children }) {
  return (
    <Link href={href} className={`puce${actif ? " puce--active" : ""}`} aria-current={actif ? "true" : undefined}>
      {children}
    </Link>
  );
}

// Filtres du fil. Tout passe par l'adresse (?q=…&type=…) : la page marche sans JavaScript et se partage.
export default function Filtres({ filtres }) {
  const { q, type, categorie, campus, vue } = filtres;
  const actifs = Boolean(q || type || categorie || campus || vue);
  return (
    <div className="filtres">
      <div className="filtres__puces">
        <Puce href={lien(filtres, { vue: "" })} actif={!vue}>
          Tout le campus
        </Puce>
        <Puce href={lien(filtres, { vue: "pour-toi" })} actif={vue === "pour-toi"}>
          Pour toi
        </Puce>
        <span className="filtres__separateur" aria-hidden="true" />
        {Object.entries(TYPES).map(([valeur, label]) => (
          <Puce key={valeur} href={lien(filtres, { type: type === valeur ? "" : valeur })} actif={type === valeur}>
            {label}
          </Puce>
        ))}
      </div>

      <form action="/annonces" className="filtres__formulaire" role="search">
        {type && <input type="hidden" name="type" value={type} />}
        {vue && <input type="hidden" name="vue" value={vue} />}
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
      {actifs && (
        <Link href="/annonces" className="filtres__effacer">
          Effacer les filtres
        </Link>
      )}
    </div>
  );
}
