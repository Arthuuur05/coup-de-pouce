import { IconeSoleil } from "./Icones";

export default function BandeauMeteo({ children }) {
  return (
    <div className="meteo">
      <IconeSoleil width={26} height={26} />
      <div>
        <div className="meteo__titre">MÉTÉO DU CAMPUS</div>
        <div className="meteo__texte">{children}</div>
      </div>
    </div>
  );
}
