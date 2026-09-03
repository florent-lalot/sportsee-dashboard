import { apiFetch } from "./apiClient";

/** GET /api/user-info → profil + objectifs de l'utilisateur connecté. */
export const getUserInfo = () => apiFetch("/api/user-info");

/**
 * GET /api/user-activity → sessions de course entre 2 dates (bornes incluses).
 * @param {string} startWeek format "YYYY-MM-DD"
 * @param {string} endWeek   format "YYYY-MM-DD"
 */
export const getUserActivity = (startWeek, endWeek) =>
  apiFetch(`/api/user-activity?startWeek=${startWeek}&endWeek=${endWeek}`);
