export const metadata = {
  title: "Coup de Pouce",
  description: "L'entraide entre étudiants du campus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
