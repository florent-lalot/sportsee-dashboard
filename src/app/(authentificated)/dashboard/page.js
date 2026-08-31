"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { ROUTES } from "@/config/routes";

export default function DashboardPage() {
  const { logout } = useAuth();
  const { user, isLoading } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  if (isLoading) return <p>Chargement...</p>;
  if (!user) return <p>Aucune donnee disponible.</p>;

  return (
    <main>
      <h1>Bonjour {user.profile.firstName}</h1>

      <ul>
        <li>Distance totale : {user.statistics.totalDistance} km</li>
        <li>Seances : {user.statistics.totalSessions}</li>
        <li>Duree totale : {user.statistics.totalDuration} min</li>
      </ul>

      <button onClick={handleLogout}>Se deconnecter</button>
    </main>
  );
}
