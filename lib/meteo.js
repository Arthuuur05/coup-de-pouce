// Règles de la météo du campus, partagées entre les actions et les écrans.
export const TITRE_MAX = 80;
export const TEXTE_MAX = 600;

// Le lundi (AAAA-MM-JJ) de la semaine d'une date, à l'heure de Paris.
export function lundiDeLaSemaine(date = new Date()) {
  const paris = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const retard = (paris.getDay() + 6) % 7;
  paris.setDate(paris.getDate() - retard);
  const pad = (n) => String(n).padStart(2, "0");
  return `${paris.getFullYear()}-${pad(paris.getMonth() + 1)}-${pad(paris.getDate())}`;
}

export const dateLongue = (aaaammjj) =>
  new Date(`${aaaammjj}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

// Le bulletin proposé : calculé depuis les annonces « Je cherche » de la semaine, sans IA externe.
// L'administratrice peut tout modifier avant de publier.
export function bulletinModele(besoins) {
  if (!besoins.length) {
    return {
      titre: "Semaine calme sur le campus",
      texte: "Peu d'annonces « Je cherche » cette semaine. C'est le bon moment pour proposer un coup de main : quelqu'un en aura besoin.",
    };
  }
  const liste = besoins.map((b) => `${b.categorie} (${b.nombre})`);
  const fin = liste.length > 1 ? `${liste.slice(0, -1).join(", ")} et ${liste.at(-1)}` : liste[0];
  return {
    titre: `Le campus cherche : ${besoins[0].categorie}`,
    texte: `Cette semaine, les étudiants cherchent surtout de l'aide en ${fin}. Si tu sais faire, touche « Je peux aider » : ça peut changer la semaine de quelqu'un.`,
  };
}
