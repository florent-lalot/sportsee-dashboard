import { apiFetch } from "./apiClient";
import { USE_MOCKS } from "@/config/app";
import { mockUserInfo, mockActivityForToday } from "@/mocks/mockData";

/**
 * Seul endroit du projet ou l'on choisit entre les donnees fictives et l'API.
 * Les deux branches renvoient une promesse et la MEME structure de donnees :
 * tout ce qui se trouve au-dessus (hook, contexte, models, composants)
 * fonctionne a l'identique dans les deux cas.
 */

/**
 * Enveloppe les donnees fictives dans une promesse, comme le ferait un appel
 * reseau : les appelants ecrivent .then() sans savoir d'ou vient la donnee.
 */
const fakeNetwork = (data) => Promise.resolve(data);

/** GET /api/user-info -> profil + statistiques globales de l'utilisateur connecte. */
export function getUserInfo() {
  if (USE_MOCKS) return fakeNetwork(mockUserInfo);

  return apiFetch("/api/user-info");
}

/**
 * GET /api/user-activity -> seances de course entre 2 dates (bornes incluses).
 * @param {string} startWeek format "YYYY-MM-DD"
 * @param {string} endWeek   format "YYYY-MM-DD"
 */
export function getUserActivity(startWeek, endWeek) {
  if (USE_MOCKS) {
    // On filtre comme le ferait le backend, pour que la navigation entre
    // periodes se comporte de la meme facon qu'avec l'API.
    const sessions = mockActivityForToday().filter(
      (session) => session.date >= startWeek && session.date <= endWeek,
    );

    return fakeNetwork(sessions);
  }

  return apiFetch(
    `/api/user-activity?startWeek=${startWeek}&endWeek=${endWeek}`,
  );
}
