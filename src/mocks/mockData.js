/**
 * Mocks de données SportSee
 *
 * Ces objets reproduisent EXACTEMENT la structure renvoyee par l'API
 * (relevee via Postman le 28/08/2026). Aucune transformation ici :
 * le formatage pour les graphiques appartient a src/models/.
 *
 * Source : http://localhost:8000
 *   POST /api/login
 *   GET  /api/user-info
 *   GET  /api/user-activity?startWeek=&endWeek=
 */

/** Reponse de POST /api/login */
export const mockLoginResponse = {
  token: "mock.jwt.token.for.development",
  userId: "user123",
};

/** Reponse de GET /api/user-info */
export const mockUserInfo = {
  profile: {
    firstName: "Sophie",
    lastName: "Martin",
    createdAt: "2025-01-01",
    age: 32,
    weight: 60,
    height: 165,
    profilePicture: "http://localhost:8000/images/sophie.jpg",
  },
  statistics: {
    // /!\ totalDistance est une CHAINE (le backend applique .toFixed(1))
    totalDistance: "2250.2",
    totalSessions: 348,
    totalDuration: 14625,
  },
};

/** Reponse de GET /api/user-activity?startWeek=2026-08-01&endWeek=2026-08-28 */
/**
 * Réponse de GET /api/user-activity.
 *
 * Extrait réel des données de Sophie Martin, sur la période la plus dense
 * du jeu de données (6 séances sur la dernière semaine). Choisi pour que
 * les graphiques soient lisibles pendant le développement : en moyenne,
 * les utilisateurs ne courent que 1 à 2 fois par semaine.
 */
export const mockUserActivity = [
  { date: "2027-12-14", distance: 4.5, duration: 30, heartRate: { min: 144, max: 178, average: 166 }, caloriesBurned: 330 },
  { date: "2027-12-21", distance: 3.8, duration: 25, heartRate: { min: 145, max: 180, average: 168 }, caloriesBurned: 285 },
  { date: "2027-12-28", distance: 5, duration: 33, heartRate: { min: 143, max: 177, average: 165 }, caloriesBurned: 360 },
  { date: "2028-01-02", distance: 4.2, duration: 28, heartRate: { min: 145, max: 175, average: 164 }, caloriesBurned: 312 },
  { date: "2028-01-04", distance: 5.8, duration: 38, heartRate: { min: 140, max: 178, average: 163 }, caloriesBurned: 422 },
  { date: "2028-01-04", distance: 5.8, duration: 38, heartRate: { min: 140, max: 178, average: 163 }, caloriesBurned: 422 },
  { date: "2028-01-05", distance: 3.2, duration: 20, heartRate: { min: 148, max: 184, average: 170 }, caloriesBurned: 248 },
  { date: "2028-01-05", distance: 3.2, duration: 20, heartRate: { min: 148, max: 184, average: 171 }, caloriesBurned: 248 },
  { date: "2028-01-09", distance: 6.4, duration: 42, heartRate: { min: 140, max: 176, average: 162 }, caloriesBurned: 468 },
  { date: "2028-01-09", distance: 6.4, duration: 42, heartRate: { min: 140, max: 176, average: 163 }, caloriesBurned: 468 },
];

/** Cas limite : période sans seance. L'API renvoie 200 + [] , pas une erreur. */
export const mockEmptyActivity = [];
