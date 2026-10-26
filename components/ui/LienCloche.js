import Link from "next/link";
import { IconeCloche } from "./Icones";

// Cloche des notifications, avec le nombre de non lues.
export default function LienCloche({ nonLues = 0, actif = false }) {
  return (
    <Link
      href="/notifications"
      className={`cloche${actif ? " cloche--active" : ""}`}
      aria-label={nonLues ? `Notifications, ${nonLues} non lues` : "Notifications"}
      aria-current={actif ? "page" : undefined}
    >
      <IconeCloche />
      {nonLues > 0 && <span className="pastille" aria-hidden="true">{nonLues}</span>}
    </Link>
  );
}
