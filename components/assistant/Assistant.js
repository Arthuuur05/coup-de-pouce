"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import CarteAnnonce from "../ui/CarteAnnonce";
import { poserQuestion } from "../../lib/actions/assistant";
import { EXEMPLES_ASSISTANT } from "../../lib/aide/assistant";

// Le petit chat : la personne écrit, l'assistant répond (texte + annonces + liens). La conversation n'est pas enregistrée.
export default function Assistant() {
  const [echanges, setEchanges] = useState([]); // { question, reponse? }
  const [saisie, setSaisie] = useState("");
  const [enCours, demarrer] = useTransition();
  const fin = useRef(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [echanges]);

  const envoyer = (texte) => {
    const question = String(texte ?? "").trim();
    if (!question || enCours) return;
    setSaisie("");
    setEchanges((avant) => [...avant, { question }]);
    demarrer(async () => {
      let reponse;
      try {
        reponse = await poserQuestion(question);
      } catch {
        reponse = { texte: "Je n'ai pas réussi à répondre. Réessaie dans un instant.", annonces: [], liens: [] };
      }
      setEchanges((avant) => avant.map((e, i) => (i === avant.length - 1 && !e.reponse ? { ...e, reponse } : e)));
    });
  };

  return (
    <div className="assistant">
      <div className="assistant__fil" role="log" aria-live="polite" aria-label="Conversation avec l'assistant">
        <div className="bulle assistant__bulle">
          <p className="bulle__texte">
            Salut ! Demande-moi par exemple : « qui peut m'aider en maths ce week-end ? ». Je cherche dans les annonces en ligne.
          </p>
        </div>
        {echanges.length === 0 && (
          <ul className="assistant__exemples" aria-label="Exemples de questions">
            {EXEMPLES_ASSISTANT.map((e) => (
              <li key={e}>
                <button type="button" className="puce" onClick={() => envoyer(e)}>
                  {e}
                </button>
              </li>
            ))}
          </ul>
        )}
        {echanges.map((e, i) => (
          <div key={i} className="assistant__echange">
            <div className="bulle bulle--moi">
              <p className="bulle__texte">{e.question}</p>
            </div>
            {e.reponse ? <Reponse r={e.reponse} envoyer={envoyer} /> : <div className="bulle assistant__bulle"><p className="bulle__texte">Je cherche…</p></div>}
          </div>
        ))}
        <div ref={fin} />
      </div>

      <form
        className="assistant__ecrire"
        onSubmit={(evt) => {
          evt.preventDefault();
          envoyer(saisie);
        }}
      >
        <label className="visuellement-cache" htmlFor="question-assistant">
          Ta question
        </label>
        <input
          id="question-assistant"
          className="champ__input"
          value={saisie}
          maxLength={200}
          autoComplete="off"
          placeholder="Qui peut m'aider en maths ce week-end ?"
          onChange={(e) => setSaisie(e.target.value)}
        />
        <button type="submit" className="bouton bouton--accent" disabled={enCours || !saisie.trim()}>
          {enCours ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

function Reponse({ r, envoyer }) {
  return (
    <div className="bulle assistant__bulle">
      {r.compris && <p className="assistant__compris">{r.compris}</p>}
      <p className="bulle__texte">{r.texte}</p>
      {r.annonces?.length > 0 && (
        <div className="assistant__annonces">
          {r.annonces.map((a, i) => (
            <CarteAnnonce
              key={a.id}
              index={i}
              type={a.type}
              categorie={a.categorie}
              titre={a.titre}
              extrait={a.extrait}
              auteur={a.auteur}
              avatar={{ prenom: a.prenom, photoUrl: a.photoUrl }}
              photo={a.photo}
              date={a.quand ? `${a.quand}${a.momentTrouve ? " ✓" : ""}` : a.date}
              href={`/annonces/${a.id}`}
            />
          ))}
        </div>
      )}
      {r.liens?.length > 0 && (
        <ul className="assistant__liens">
          {r.liens.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="bouton bouton--secondaire demande__petit">
                {l.libelle}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {r.exemples && (
        <ul className="assistant__exemples" aria-label="Exemples de questions">
          {r.exemples.map((e) => (
            <li key={e}>
              <button type="button" className="puce" onClick={() => envoyer(e)}>
                {e}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
