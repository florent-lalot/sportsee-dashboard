"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { mockUserInfo } from "@/mocks/mockData";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    // TEMPORAIRE : donnees mockees.
    // Sera remplace par l'appel API dans le hook dedie a l'etape 5.
    setIsLoading(true);
    setUser(mockUserInfo);
    setIsLoading(false);
  }, [isAuthenticated]);

  const value = { user, isLoading, error };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser doit etre utilise dans un <UserProvider>");
  }
  return context;
}
