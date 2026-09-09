/**
 * Normalise et agrege GET /api/user-activity.
 * Les composants de graphique recoivent des données deja pretes :
 * ils n'ont aucun calcul a faire.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Tableau brut de l'API -> sessions normalisees (nombres garantis, date en objet Date). */
export function activityModel(rawSessions) {
  if (!Array.isArray(rawSessions)) return [];

  return rawSessions.map((session) => ({
    date: new Date(session.date),
    isoDate: session.date,
    distanceKm: Number(session.distance) || 0,
    durationMin: Number(session.duration) || 0,
    calories: Number(session.caloriesBurned) || 0,
    heartRate: {
      min: Number(session.heartRate?.min) || 0,
      max: Number(session.heartRate?.max) || 0,
      average: Number(session.heartRate?.average) || 0,
    },
  }));
}

/**
 * Kilometres cumules par semaine, sur les N dernières semaines.
 * -> [{ label: "S1", km: 19.6, start: Date, end: Date }]
 */
export function toWeeklyDistance(sessions, weeks = 4, endDate = null) {
  // Sans endDate, la fenetre s'ancre sur la derniere seance connue.
  // Avec endDate, elle s'ancre sur la date demandee : c'est ce qui
  // permet de naviguer d'une periode a l'autre.
  if (!endDate && !sessions.length) return [];

  const lastDay = endDate
    ? new Date(endDate)
    : new Date(Math.max(...sessions.map((s) => s.date.getTime())));
  lastDay.setHours(23, 59, 59, 999);

  const buckets = Array.from({ length: weeks }, (_, index) => ({
    label: `S${index + 1}`,
    km: 0,
    start: new Date(lastDay.getTime() - (weeks - index) * 7 * DAY_MS + 1),
    end: new Date(lastDay.getTime() - (weeks - 1 - index) * 7 * DAY_MS),
  }));

  for (const session of sessions) {
    const bucket = buckets.find(
      (b) => session.date >= b.start && session.date <= b.end,
    );
    if (bucket) bucket.km += session.distanceKm;
  }

  return buckets.map((bucket) => ({
    ...bucket,
    km: Math.round(bucket.km * 10) / 10,
  }));
}

/**
 * Frequence cardiaque repartie sur Lun -> Dim.
 * -> [{ day: "Lun", min: 139, max: 179, average: 162 }]
 */
export function toWeeklyHeartRate(sessions) {
  const byDay = {};

  for (const session of sessions) {
    // getDay() renvoie 0 pour dimanche : on decale pour commencer au lundi.
    const name = WEEKDAYS[(session.date.getDay() + 6) % 7];
    byDay[name] = session.heartRate;
  }

  return WEEKDAYS.map((day) => ({
    day,
    min: byDay[day]?.min ?? null,
    max: byDay[day]?.max ?? null,
    average: byDay[day]?.average ?? null,
  }));
}

/** Totaux d'une période, y compris les données que l'API ne fournit pas. */
export function summarize(sessions) {
  if (!sessions.length) {
    return {
      distanceKm: 0,
      durationMin: 0,
      calories: 0,
      sessionCount: 0,
      restDays: 0,
      averageHeartRate: 0,
    };
  }

  const distanceKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  const durationMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const calories = sessions.reduce((sum, s) => sum + s.calories, 0);
  const heartSum = sessions.reduce((sum, s) => sum + s.heartRate.average, 0);

  // Jours de repos = jours de la période sans aucune seance.
  const times = sessions.map((s) => s.date.getTime());
  const spanDays =
    Math.round((Math.max(...times) - Math.min(...times)) / DAY_MS) + 1;
  const activeDays = new Set(sessions.map((s) => s.isoDate)).size;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin,
    calories,
    sessionCount: sessions.length,
    restDays: Math.max(0, spanDays - activeDays),
    averageHeartRate: Math.round(heartSum / sessions.length),
  };
}
/** "28 mai - 25 juin" à partir de deux dates. */
export function formatRange(start, end) {
  if (!start || !end) return "";
  const options = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("fr-FR", options)} - ${end.toLocaleDateString("fr-FR", options)}`;
}

/** Libellé de période pour un tableau de semaines. */
export function formatPeriod(weeks) {
  if (!weeks.length) return "";
  return formatRange(weeks[0].start, weeks[weeks.length - 1].end);
}

/**
 * Isole les séances des 7 derniers jours, à partir de la dernière séance.
 * -> { sessions, start, end, label }
 */
export function lastWeek(sessions, days = 7, endDate = null) {
  if (!endDate && !sessions.length) {
    return { sessions: [], start: null, end: null, label: "" };
  }

  const end = endDate
    ? new Date(endDate)
    : new Date(Math.max(...sessions.map((s) => s.date.getTime())));
  end.setHours(23, 59, 59, 999);

  const start = new Date(end.getTime() - days * DAY_MS + 1);
  start.setHours(0, 0, 0, 0);

  return {
    sessions: sessions.filter((s) => s.date >= start && s.date <= end),
    start,
    end,
    label: formatRange(start, end),
  };
}
/** "Du 23/06/2025 au 30/06/2025" */
export function formatFullRange(start, end) {
  if (!start || !end) return "";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return `Du ${start.toLocaleDateString("fr-FR", options)} au ${end.toLocaleDateString("fr-FR", options)}`;
}
