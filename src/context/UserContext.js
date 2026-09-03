"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getUserInfo } from "@/services/userService";
import { userModel } from "@/models/userModel";
import { isSessionExpired } from "@/services/apiClient";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { isAuthenticated, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Déconnecté : on vide tout, aucun appel réseau
    if (!isAuthenticated) {
      setUser(null);
      setError(null);
      return;
    }

    // Garde-fou : si le composant est démonté (ou l'utilisateur déconnecté)
    // avant la fin de la requête, on ignore la réponse tardive.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getUserInfo()
      .then((data) => {
        if (!cancelled) setUser(userModel(data));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isSessionExpired(err.status)) return logout(); // token expire ou invalide
        setUser(null);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, logout]);

  const value = { user, isLoading, error };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser doit être utilisé dans un <UserProvider>");
  }
  return context;
}
