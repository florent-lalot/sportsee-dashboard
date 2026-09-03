"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserActivity } from "@/services/userService";
import { isSessionExpired } from "@/services/apiClient";
import { activityModel } from "@/models/activityModel";

/**
 * Récupère les séances de course sur une plage de dates.
 * @param {string} startWeek "YYYY-MM-DD"
 * @param {string} endWeek   "YYYY-MM-DD"
 * @returns {{sessions: Array, isLoading: boolean, error: string|null}}
 */
export function useUserActivity(startWeek, endWeek) {
  const { isAuthenticated, logout } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    // Les dates ne sont pas encore connues (profil en cours de chargement) :
    // on ne lance rien et on reste en etat de chargement.
    if (!startWeek || !endWeek) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getUserActivity(startWeek, endWeek)
      .then((data) => {
        if (!cancelled) setSessions(activityModel(data));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isSessionExpired(err.status)) return logout();
        setSessions([]);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, startWeek, endWeek, logout]);

  return { sessions, isLoading, error };
}
