"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { login as loginRequest } from "@/services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Le cookie est HttpOnly : le frontend demande seulement l'etat de session.
  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : { authenticated: false }))
      .then(({ authenticated }) => setIsAuthenticated(authenticated))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username, password) => {
    const data = await loginRequest(username, password);
    setIsAuthenticated(true);
    setUserId(data.userId ?? null);
    return data;
  };

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setIsAuthenticated(false);
    setUserId(null);
  }, []);

  const value = {
    userId,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth doit etre utilise dans un <AuthProvider>");
  }
  return context;
}
