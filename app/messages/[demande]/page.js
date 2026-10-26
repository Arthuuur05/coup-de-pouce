import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EcranConnecte from "../../../components/ui/EcranConnecte";
import Initiale from "../../../components/ui/Initiale";
import FormMessage from "../../../components/messages/FormMessage";
import { profilConnecte } from "../../../lib/profil";
import { chargerConversation } from "../../../lib/donnees-messages";
import { dateRelative } from "../../../lib/annonces";

export const metadata = { title: "Conversation · Coup de Pouce" };

export default async function Conversation({ params }) {
  const { demande } = await params;
  const moi = await profilConnecte();
  if (!moi) redirect(`/connexion?suite=/messages/${demande}`);
  const conversation = await chargerConversation(demande, moi.id);
  if (!conversation) notFound();
  const { autre, autreId, titre, messages } = conversation;
  const prenom = autre?.prenom || "Un étudiant";

  return (
    <EcranConnecte titre={prenom} sousTitre={titre ? `À propos de « ${titre} »` : undefined} onglet="demandes">
      <div className="rangee">
        <Link href="/messages" className="bouton bouton--secondaire">
          ← Messages
        </Link>
        <Link href={`/etudiants/${autreId}`} className="messagerie__profil">
          <Initiale prenom={autre?.prenom} photo={autre?.photoUrl} petite /> Voir son profil
        </Link>
      </div>
      <div className="messagerie" role="log" aria-label={`Conversation avec ${prenom}`}>
        {messages.length === 0 ? (
          <p className="carte__date" style={{ margin: 0 }}>
            Pas encore de message. Dis bonjour à {prenom} !
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`bulle${m.auteur === moi.id ? " bulle--moi" : ""}`}>
              <p className="bulle__texte">{m.texte}</p>
              <span className="carte__date">{dateRelative(m.cree_le)}</span>
            </div>
          ))
        )}
      </div>
      <FormMessage demandeId={demande} />
      <p className="champ__aide" style={{ margin: 0 }}>
        La conversation se ferme si l'un de vous retire son accord. Ne partage pas d'informations que tu veux garder privées.
      </p>
    </EcranConnecte>
  );
}
