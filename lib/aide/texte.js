// Outils de texte communs à l'aide à la rédaction et à l'assistant.

// Minuscules sans accents, une lettre pour une lettre : les positions restent les mêmes que dans le texte d'origine,
// ce qui permet de retrouver le morceau d'origine (avec ses accents) à partir d'une position trouvée ici.
export function plat(texte) {
  return Array.from(String(texte ?? "").toLowerCase(), (c) => {
    if (c === "’" || c === "‘" || c === "`") return "'";
    if (c === "œ") return "o";
    if (c === "æ") return "a";
    return c.normalize("NFD")[0];
  }).join("");
}

// Les mots d'un texte, dans l'ordre : { plat, brut, debut, fin }.
export function mots(texte) {
  const brut = String(texte ?? "");
  const p = plat(brut);
  const resultat = [];
  for (const m of p.matchAll(/[a-z0-9][a-z0-9'-]*/g)) {
    resultat.push({ plat: m[0].replace(/^[a-z]'/, ""), brut: brut.slice(m.index, m.index + m[0].length).replace(/^[a-zA-Z]'/, ""), debut: m.index, fin: m.index + m[0].length });
  }
  return resultat;
}

// Est-ce que le mot est cette entrée du lexique ? Les entrées de plus de 3 lettres reconnaissent aussi leurs dérivés.
export function reconnait(mot, entree) {
  if (mot === entree) return true;
  return entree.length > 3 && mot.length > entree.length && mot.startsWith(entree);
}

export const premiereMajuscule = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

// Coupe proprement à n caractères, sur une fin de mot, avec « … » si le texte était plus long.
export function couper(texte, n) {
  const t = String(texte).trim();
  if (t.length <= n) return t;
  const coupe = t.slice(0, n - 1);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > n * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

// « de maths », « d'anglais ».
export const deMot = (m) => (/^[aeiouyhéèêàâîôû]/i.test(m) ? `d'${m}` : `de ${m}`);
