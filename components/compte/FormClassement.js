import BoutonAction from "../ui/BoutonAction";
import { reglerClassement } from "../../lib/actions/classement";

// Choisir d'apparaître (ou non) dans le classement amical du campus.
export default function FormClassement({ visible }) {
  return (
    <form action={reglerClassement} className="formulaire">
      <label className="case">
        <input type="checkbox" name="classement" defaultChecked={visible} />
        <span>Apparaître dans le classement amical du campus (prénom et nombre de coups de pouce du mois, rien d'autre)</span>
      </label>
      <BoutonAction className="bouton bouton--principal" enCours="Enregistrement…">
        Enregistrer
      </BoutonAction>
    </form>
  );
}
