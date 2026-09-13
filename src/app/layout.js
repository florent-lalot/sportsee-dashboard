import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import "./globals.css";

export const metadata = {
  title: "SportSee",
  description: "Tableau de bord d'analytics sportif",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
