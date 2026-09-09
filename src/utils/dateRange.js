/**
 * Formate une Date en "YYYY-MM-DD" (fuseau LOCAL).
 * On n'utilise pas toISOString() : il convertit en UTC et peut décaler
 * la date d'un jour selon l'heure et le fuseau.
 */
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Plage glissante des N dernières semaines, bornes incluses, finissant aujourd'hui.
 * @param {number} weeks nombre de semaines
 * @returns {{startWeek: string, endWeek: string}}
 */
export function lastWeeksRange(weeks, reference = new Date()) {
  const end = new Date(reference);
  const start = new Date(reference);
  start.setDate(start.getDate() - (weeks * 7 - 1)); // -27 jours pour 4 semaines

  return { startWeek: toISODate(start), endWeek: toISODate(end) };
}

/**
 * Fin d'une fenetre glissante, decalee de N semaines vers le passe.
 * offsetWeeks = 0 -> aujourd'hui, 1 -> il y a 7 jours, etc.
 * @returns {Date} fin de journee (23:59:59.999)
 */
export function weeksAgo(offsetWeeks = 0, reference = new Date()) {
  const date = new Date(reference);
  date.setDate(date.getDate() - offsetWeeks * 7);
  date.setHours(23, 59, 59, 999);
  return date;
}
