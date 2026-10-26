// Rendez-vous des coups de pouce. Toutes les heures sont celles de Paris (les étudiants sont en France), stockées en UTC.
export const FUSEAU = "Europe/Paris";
export const LIEU_MAX = 80;

const decoupe = (ms) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: FUSEAU, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value]),
  );
  return parts;
};

// Décalage de Paris par rapport à UTC, en millisecondes, à l'instant ms.
const decalage = (ms) => {
  const p = decoupe(ms);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
};

// « 2026-11-03T14:30 » (heure de Paris, champ datetime-local) → Date. null si le texte n'est pas une date valable.
export function parisVersDate(texte) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(texte ?? ""));
  if (!m) return null;
  const [annee, mois, jour, heure, minute] = m.slice(1).map(Number);
  const brut = Date.UTC(annee, mois - 1, jour, heure, minute);
  const controle = new Date(brut);
  if (controle.getUTCMonth() !== mois - 1 || controle.getUTCDate() !== jour || heure > 23 || minute > 59) return null;
  let utc = brut - decalage(brut);
  const second = decalage(utc);
  if (second !== decalage(brut)) utc = brut - second;
  return new Date(utc);
}

// Date → « 2026-11-03T14:30 » à l'heure de Paris (valeur d'un champ datetime-local).
export function dateVersParis(date) {
  const p = decoupe(new Date(date).getTime());
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// « mardi 3 novembre à 14 h 30 »
export function jourHeure(date) {
  const d = new Date(date);
  const jour = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long" }).format(d);
  return `${jour} à ${heureSeule(d)}`;
}

// « 14 h 30 »
export const heureSeule = (date) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" }).format(new Date(date)).replace(":", " h ");

// La clé de regroupement par jour : « 2026-11-03 ».
export const cleJour = (date) => dateVersParis(date).slice(0, 10);

export const jourSeul = (date) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(date));

// « dans 2 jours », « demain », « aujourd'hui », « dans 3 h ».
export function dans(date, maintenant = Date.now()) {
  const ms = new Date(date).getTime() - maintenant;
  if (ms < 0) return "passé";
  const heures = Math.floor(ms / 3600000);
  if (heures < 1) return "dans moins d'une heure";
  if (heures < 24 && cleJour(date) === cleJour(maintenant)) return `aujourd'hui, dans ${heures} h`;
  const ecart = Math.round((Date.parse(`${cleJour(date)}T00:00:00Z`) - Date.parse(`${cleJour(maintenant)}T00:00:00Z`)) / 86400000);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return `dans ${ecart} jours`;
}

// Pour l'agenda du téléphone : un événement d'une heure avec rappel la veille et une heure avant.
const echappe = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function evenementIcs({ id, quand, lieu, titre, prenom }) {
  const debut = new Date(quand);
  const fin = new Date(debut.getTime() + 3600000);
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coup de Pouce//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:rdv-${id}@coup-de-pouce`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(debut)}`,
    `DTEND:${utc(fin)}`,
    `SUMMARY:${echappe(`Coup de pouce : ${titre}`)}`,
    `DESCRIPTION:${echappe(`Rendez-vous avec ${prenom} pour « ${titre} ».`)}`,
  ];
  if (lieu) lignes.push(`LOCATION:${echappe(lieu)}`);
  lignes.push(
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Rendez-vous demain", "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Rendez-vous dans une heure", "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return `${lignes.join("\r\n")}\r\n`;
}
