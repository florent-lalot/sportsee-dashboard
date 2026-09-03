"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { login as loginRequest } from "@/services/authService";
import { setToken, getToken, removeToken } from "@/services/cookies";

const AuthContext = createContext(null);

/** Extrait le userId du payload du JWT (la partie centrale, encodee en Base64). */
function getUserIdFromToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)).userId ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au demarrage : si un cookie existe deja, l'utilisateur est encore connecte
  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      setTokenState(existingToken);
      setUserId(getUserIdFromToken(existingToken));
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await loginRequest(username, password);
    setToken(data.token); // dans le cookie  -> pour le middleware
    setTokenState(data.token); // dans le state   -> pour les composants
    setUserId(data.userId);
    return data;
  };

  // useCallback : garde la même référence entre les rendus, pour pouvoir
  // l'utiliser sans risque dans les dépendances d'un useEffect.
  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUserId(null);
  }, []);

  const value = {
    token,
    userId,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return context;
}
