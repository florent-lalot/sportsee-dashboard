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
export const mockUserActivity = [
  {
    date: "2026-08-03",
    distance: 8.5,
    duration: 55,
    heartRate: { min: 139, max: 179, average: 162 },
    caloriesBurned: 590,
  },
  {
    date: "2026-08-07",
    distance: 4.9,
    duration: 32,
    heartRate: { min: 143, max: 179, average: 166 },
    caloriesBurned: 350,
  },
  {
    date: "2026-08-10",
    distance: 7.3,
    duration: 47,
    heartRate: { min: 140, max: 178, average: 163 },
    caloriesBurned: 510,
  },
  {
    date: "2026-08-17",
    distance: 11.5,
    duration: 75,
    heartRate: { min: 132, max: 180, average: 157 },
    caloriesBurned: 785,
  },
  {
    date: "2026-08-24",
    distance: 5.6,
    duration: 36,
    heartRate: { min: 142, max: 178, average: 164 },
    caloriesBurned: 395,
  },
];

/** Cas limite : periode sans seance. L'API renvoie 200 + [] , pas une erreur. */
export const mockEmptyActivity = [];
