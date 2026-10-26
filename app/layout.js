import { Barlow_Condensed, DM_Sans, Caveat_Brush } from "next/font/google";
import "./globals.css";

const titre = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-titre" });
const texte = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-texte" });
const main = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-main" });

export const metadata = {
  title: "Coup de Pouce",
  description: "L'entraide entre étudiants du campus",
};

export const viewport = { themeColor: "#111111" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable} ${main.variable}`}>
      <body>
        <a href="#contenu" className="lien-evitement">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
