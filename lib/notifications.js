// Textes et liens des notifications. « Sans suite » : on ne dit pas « refusé » à celui qui demande.
export const NOTIFICATIONS = {
  demande_recue: { verbe: "a demandé ton contact pour", lien: (n) => `/demandes#demande-${n.demande}` },
  acceptee: { verbe: "a accepté ta demande pour", lien: (n) => `/demandes?onglet=envoyees#demande-${n.demande}` },
  sans_suite: { verbe: "n'a pas donné suite à ta demande pour", lien: (n) => `/demandes?onglet=envoyees#demande-${n.demande}` },
  message_recu: { verbe: "t'a écrit à propos de", lien: (n) => `/messages/${n.demande}` },
  alerte: { verbe: "a publié, ça correspond à ton alerte :", lien: (n) => `/annonces/${n.annonce}` },
  rdv_fixe: { verbe: "a fixé un rendez-vous pour", lien: () => "/calendrier" },
  rdv_annule: { verbe: "a annulé le rendez-vous pour", lien: () => "/calendrier" },
  rdv_rappel: { verbe: "t'attend dans moins de 24 h pour", lien: () => "/calendrier" },
  avis_recu: { verbe: "t'a laissé un avis après", lien: () => "/profil" },
};
