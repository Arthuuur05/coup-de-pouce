import { redirect } from "next/navigation";

// L'assistant est maintenant le chatbot en bas à droite de chaque écran.
export default function PageAssistant() {
  redirect("/annonces");
}
