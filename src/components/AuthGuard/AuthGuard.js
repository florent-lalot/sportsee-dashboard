"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/config/routes";

/**
 * Pendant de client de proxy.js : renvoie vers la connexion
 * dès que la session tombe (token expiré, déconnexion sur 401).
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // isLoading : au tout premier rendu, le cookie n'est pas encore relu.
    // Sans cette condition on redirigerait un utilisateur pourtant connecté.
    if (!isLoading && !isAuthenticated) router.replace(ROUTES.LOGIN);
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return children;
}
