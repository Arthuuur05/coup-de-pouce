import Bouton from "../../components/ui/Bouton";
import Etiquette from "../../components/ui/Etiquette";
import CarteAnnonce from "../../components/ui/CarteAnnonce";
import Champ from "../../components/ui/Champ";
import BandeauMeteo from "../../components/ui/BandeauMeteo";
import BandeauHaut from "../../components/ui/BandeauHaut";
import MotManuscrit from "../../components/ui/MotManuscrit";
import MenuBas from "../../components/ui/MenuBas";
import Coordonnees from "../../components/demandes/Coordonnees";

export const metadata = { title: "Design system · Coup de Pouce" };

const couleurs = [
  ["Rouge", "--rouge", "#C62828"],
  ["Noir", "--noir", "#111111"],
  ["Crème", "--creme", "#F5F1EA"],
  ["Blanc", "--blanc", "#FFFFFF"],
  ["Gris", "--gris", "#55524A"],
  ["Rouge clair", "--rouge-clair", "#FFB4B4"],
];

function Section({ titre, children }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>{titre}</h2>
      {children}
    </section>
  );
}

export default function Design() {
  return (
    <>
      <BandeauHaut>Design system · v1 · 22 octobre</BandeauHaut>
      <main className="page" style={{ gap: 32 }}>
        <div style={{ position: "relative" }}>
          <h1>
            Coup de
            <br />
            Pouce
          </h1>
          <MotManuscrit style={{ position: "absolute", right: 10, top: 20 }}>la DA</MotManuscrit>
        </div>

        <Section titre="Couleurs">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {couleurs.map(([nom, variable, hex]) => (
              <div key={variable} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ height: 56, background: `var(${variable})`, border: "var(--contour)" }} />
                <strong style={{ fontSize: 13 }}>{nom}</strong>
                <span style={{ fontSize: 12, color: "var(--gris)" }}>{hex}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section titre="Typographie">
          <h1>Titre 54</h1>
          <h3>Titre de carte 26</h3>
          <p style={{ margin: 0 }}>Texte courant en DM Sans, 15 px. On se tutoie, phrases courtes.</p>
          <span style={{ fontSize: 12, color: "var(--gris)" }}>Légende 12 px</span>
          <MotManuscrit style={{ transform: "rotate(-6deg)" }}>mot manuscrit</MotManuscrit>
        </Section>

        <Section titre="Boutons">
          <div className="rangee">
            <Bouton variante="principal">Contacter →</Bouton>
            <Bouton variante="secondaire">Voir le profil</Bouton>
            <Bouton variante="accent">Publier</Bouton>
            <Bouton variante="danger">Refuser</Bouton>
          </div>
        </Section>

        <Section titre="Étiquettes">
          <div className="rangee">
            <Etiquette variante="propose">Je propose</Etiquette>
            <Etiquette variante="cherche">Je cherche</Etiquette>
            <Etiquette variante="categorie">Photo</Etiquette>
            <Etiquette variante="attente">En attente</Etiquette>
            <Etiquette variante="acceptee">Acceptée</Etiquette>
            <Etiquette variante="refusee">Refusée</Etiquette>
          </div>
        </Section>

        <Section titre="Cartes d'annonce">
          <CarteAnnonce
            index={0}
            type="propose"
            categorie="Photo"
            titre="Photos pour vos événements"
            auteur="Sam · M1"
            date="il y a 2 h"
            href="/design"
          />
          <CarteAnnonce
            index={1}
            type="cherche"
            categorie="Covoit"
            titre="Trajet vers Lyon vendredi soir"
            auteur="Inès · L3"
            date="hier"
          />
        </Section>

        <Section titre="Bandeau météo">
          <BandeauMeteo>On manque de monteurs vidéo cette semaine</BandeauMeteo>
        </Section>

        <Section titre="Champs">
          <Champ id="titre" label="Titre de l'annonce" defaultValue="Photos pour vos événements" />
          <Champ id="mail" label="E-mail" defaultValue="lea.campus" erreur="Il manque le @ dans ton adresse." />
        </Section>

        <Section titre="Coordonnées après accord">
          <Coordonnees prenom="Léa" coordonnees={{ email: "lea@exemple.fr", instagram: "lea.data" }} />
        </Section>

        <Section titre="Menu du bas">
          <p style={{ margin: 0 }}>
            Fixé en bas de l'écran, visible ici en dessous. La pastille <span className="pastille">2</span> compte les demandes
            reçues en attente.
          </p>
        </Section>
      </main>
      <MenuBas actif="annonces" enAttente={2} />
    </>
  );
}
