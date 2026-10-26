import Link from "next/link";
import { redirect } from "next/navigation";
import EcranConnecte from "../../components/ui/EcranConnecte";
import EtatVide from "../../components/ui/EtatVide";
import Initiale from "../../components/ui/Initiale";
import { profilConnecte } from "../../lib/profil";
import { chargerMesConversations } from "../../lib/donnees-messages";
import { dateRelative } from "../../lib/annonces";

export const metadata = { title: "Messages · Coup de Pouce" };

export default async function Messages() {
  const profil = await profilConnecte();
  if (!profil) redirect("/connexion?suite=/messages");
  const conversations = await chargerMesConversations();

  return (
    <EcranConnecte titre="Messages" sousTitre="Écris aux personnes dont la demande est acceptée, sans partager tes coordonnées." onglet="demandes">
      <nav className="filtres__puces" aria-label="Demandes ou messages">
        <Link href="/demandes" className="puce">
          Demandes
        </Link>
        <Link href="/messages" className="puce puce--active" aria-current="page">
          Messages
        </Link>
      </nav>
      {conversations.length === 0 ? (
        <EtatVide titre="Aucune conversation">
          Quand une demande est acceptée, tu peux écrire à l'autre personne ici.
        </EtatVide>
      ) : (
        <ul className="notifications">
          {conversations.map((c) => (
            <li key={c.demande}>
              <Link href={`/messages/${c.demande}`} className={`notification${c.non_lus > 0 ? " notification--nouvelle" : ""}`}>
                <Initiale prenom={c.autreProfil?.prenom} photo={c.autreProfil?.photoUrl} />
                <span className="notification__texte">
                  <strong>{c.autreProfil?.prenom || "Un étudiant"}</strong>
                  <span>« {c.titre} »</span>
                  <span className="carte__date">
                    {c.dernier_texte
                      ? `${c.dernier_auteur === profil.id ? "Toi : " : ""}${c.dernier_texte.length > 70 ? `${c.dernier_texte.slice(0, 67)}…` : c.dernier_texte} · ${dateRelative(c.dernier_le)}`
                      : "Pas encore de message"}
                  </span>
                </span>
                {c.non_lus > 0 && <span className="pastille">{c.non_lus}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </EcranConnecte>
  );
}
