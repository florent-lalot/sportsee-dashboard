/**
 * Normalise la reponse de GET /api/user-info.
 * Toute correction de format vit ici, jamais dans les composants.
 */

/**
 * Repli sur l'objectif hebdomadaire.
 *
 * L'objectif vient desormais du backend (profile.weeklyGoal). Cette valeur
 * n'est qu'un filet de securite : elle sert uniquement si l'application est
 * lancee contre une version de l'API qui n'expose pas encore ce champ.
 */
export const FALLBACK_WEEKLY_GOAL = 2;

const GENDERS = { female: "Femme", male: "Homme" };

const MONTHS = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
];

/** "2025-01-01" -> "1 janvier 2025" */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** 14625 -> { hours: 243, minutes: 45 } */
export function splitDuration(totalMinutes) {
  const minutes = Number(totalMinutes) || 0;
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

/** 165 -> "1m65" */
export function formatHeight(cm) {
  const value = Number(cm) || 0;
  const meters = Math.floor(value / 100);
  const rest = String(value % 100).padStart(2, "0");
  return `${meters}m${rest}`;
}

/** Transforme la reponse brute en objet pret a afficher. */
export function userModel(raw) {
  if (!raw?.profile) return null;

  const { profile, statistics } = raw;

  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    fullName: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
    age: Number(profile.age) || 0,
    // L'API ne renvoie pas ce champ, bien qu'il existe en base (voir mentor).
    gender: GENDERS[profile.gender] ?? null,
    weightKg: Number(profile.weight) || 0,
    heightCm: Number(profile.height) || 0,
    pictureUrl: profile.profilePicture ?? "",
    memberSince: formatDate(profile.createdAt),
    // Date brute conservée pour les appels API (memberSince est destiné à l'affichage)
    createdAt: profile.createdAt ?? null,

    // Objectif hebdomadaire, renvoye par l'API. Le repli ne joue que si
    // le backend ne l'expose pas.
    weeklyGoal: Number(profile.weeklyGoal) || FALLBACK_WEEKLY_GOAL,

    stats: {
      // L'API renvoie une CHAINE ici : on la convertit une fois pour toutes.
      totalDistanceKm: Number(statistics?.totalDistance) || 0,
      totalSessions: Number(statistics?.totalSessions) || 0,
      totalDurationMin: Number(statistics?.totalDuration) || 0,
    },
  };
}
