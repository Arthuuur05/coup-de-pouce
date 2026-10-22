// Retour après une action : erreur (rouge) ou succès (vert).
export default function Message({ type = "erreur", children }) {
  return (
    <div className={`message message--${type}`} role={type === "erreur" ? "alert" : "status"}>
      {children}
    </div>
  );
}
