export const TRAINING_GOALS = {
  "5k": {
    label: "course de 5 km",
    focus: "developper progressivement la regularite, l'allure et une courte seance de vitesse adaptee",
  },
  "10k": {
    label: "course de 10 km",
    focus: "developper l'endurance, l'allure cible et une progression de volume prudente",
  },
  half_marathon: {
    label: "semi-marathon",
    focus: "privilegier l'endurance fondamentale, les sorties longues progressives et la recuperation",
  },
  marathon: {
    label: "marathon",
    focus: "construire un volume progressif, des sorties longues et une strategie de recuperation solide",
  },
  free: {
    label: "entrainement libre",
    focus: "proposer une routine de course progressive adaptee aux disponibilites et aux donnees recentes",
  },
};

export const TRAINING_PLAN_SCHEMA = {
  name: "sportsee_training_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "goal", "durationWeeks", "weeks", "safetyNote"],
    properties: {
      title: { type: "string" },
      goal: { type: "string", enum: Object.keys(TRAINING_GOALS) },
      durationWeeks: { type: "integer", minimum: 1, maximum: 24 },
      weeks: {
        type: "array",
        minItems: 1,
        maxItems: 24,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["weekNumber", "sessions"],
          properties: {
            weekNumber: { type: "integer", minimum: 1 },
            sessions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["day", "type", "durationMin", "intensity", "instructions"],
                properties: {
                  day: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["easy_run", "intervals", "tempo", "long_run", "recovery", "rest"],
                  },
                  durationMin: { type: "integer", minimum: 0, maximum: 300 },
                  distanceKm: { type: ["number", "null"], minimum: 0, maximum: 100 },
                  intensity: { type: "string", enum: ["easy", "moderate", "hard", "rest"] },
                  instructions: { type: "string", maxLength: 280 },
                },
              },
            },
          },
        },
      },
      safetyNote: { type: "string", maxLength: 280 },
    },
  },
  strict: true,
};

const BASE_PROMPT = [
  "Tu es Coach SportSee, expert en plans de course a pied progressifs et prudents.",
  "Genere uniquement un objet JSON valide, sans Markdown ni texte supplementaire.",
  "Le JSON contient exactement title, goal, durationWeeks, weeks et safetyNote.",
  "Chaque week contient exactement weekNumber et sessions. Chaque session contient day, type, durationMin, distanceKm, intensity et instructions.",
  "Les valeurs autorisees pour type sont easy_run, intervals, tempo, long_run, recovery ou rest. Les valeurs autorisees pour intensity sont easy, moderate, hard ou rest.",
  "Garde instructions courtes : 160 caracteres maximum par seance.",
  "Utilise seulement les jours de disponibilite fournis. Ne cree aucune seance les autres jours.",
  "Adapte le volume et l'intensite au niveau et aux courses recentes. Ne suppose pas une donnee absente.",
  "Prevois au moins un jour sans course entre deux seances difficiles quand les disponibilites le permettent.",
  "Ne fournis pas de diagnostic medical. Si une contrainte signale une douleur ou blessure, reduis la charge et conseille un professionnel de sante.",
].join(" ");

function formatRuns(recentRuns = []) {
  if (!recentRuns.length) return "Aucune course recente disponible.";
  return recentRuns
    .slice(0, 5)
    .map((run) => `- ${run.date}: ${run.distanceKm} km, ${run.durationMin} min`)
    .join("\n");
}

function formatPace(seconds) {
  const boundedSeconds = Math.min(900, Math.max(180, seconds));
  const minutes = Math.floor(boundedSeconds / 60);
  const remainingSeconds = Math.round(boundedSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}/km`;
}

function paceRange(basePace, lowerOffset, upperOffset) {
  return `${formatPace(basePace + lowerOffset)} - ${formatPace(basePace + upperOffset)}`;
}

export function analyzeRunningProfile(athlete) {
  const runs = (athlete?.recentRuns ?? [])
    .filter((run) => Number(run.distanceKm) > 0 && Number(run.durationMin) > 0)
    .slice(0, 10);

  if (runs.length < 2) {
    return {
      level: "debutant_par_defaut",
      summary: "Donnees insuffisantes pour estimer le niveau ou les allures. Proposer uniquement des seances faciles progressives.",
      paceGuidance: "Aucune allure chiffree : utiliser l'effort facile et la capacite a tenir une conversation.",
    };
  }

  const totalDistance = runs.reduce((total, run) => total + Number(run.distanceKm), 0);
  const totalDuration = runs.reduce((total, run) => total + Number(run.durationMin), 0);
  const dates = runs.map((run) => new Date(`${run.date}T12:00:00`).getTime()).filter(Number.isFinite);
  const spanDays = dates.length > 1 ? Math.max(7, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86_400_000) + 1) : 7;
  const weeklyDistance = (totalDistance / spanDays) * 7;
  const basePace = (totalDuration * 60) / totalDistance;

  let level = "intermediaire";
  if (runs.length < 4 || weeklyDistance < 15) level = "debutant";
  if (runs.length >= 6 && weeklyDistance >= 40) level = "avance";

  const offsets = {
    debutant: { easy: [75, 105], tempo: [10, 25], intervals: [-10, 5], long: [90, 120] },
    intermediaire: { easy: [50, 75], tempo: [-5, 10], intervals: [-30, -10], long: [65, 95] },
    avance: { easy: [35, 60], tempo: [-15, 0], intervals: [-45, -20], long: [50, 75] },
  }[level];

  return {
    level,
    summary: `${runs.length} courses analysees, ${Math.round(totalDistance * 10) / 10} km sur ${spanDays} jours, soit environ ${Math.round(weeklyDistance * 10) / 10} km par semaine. Allure moyenne observee : ${formatPace(basePace)}.`,
    paceGuidance: [
      `facile : ${paceRange(basePace, ...offsets.easy)}`,
      `tempo : ${paceRange(basePace, ...offsets.tempo)}`,
      `fractionne : ${paceRange(basePace, ...offsets.intervals)}`,
      `sortie longue : ${paceRange(basePace, ...offsets.long)}`,
    ].join(" ; "),
  };
}

export function buildTrainingPlanPrompt({
  goal,
  durationWeeks,
  startDate = null,
  availableDays,
  constraints = "Aucune contrainte indiquee.",
  athlete,
}) {
  const goalConfig = TRAINING_GOALS[goal];
  if (!goalConfig) throw new Error("Objectif de course non pris en charge.");
  if (!Array.isArray(availableDays) || availableDays.length === 0) {
    throw new Error("Au moins un jour de disponibilite est requis.");
  }

  const profileAnalysis = analyzeRunningProfile(athlete);

  return [
    BASE_PROMPT,
    `OBJECTIF : ${goalConfig.label}. Priorite : ${goalConfig.focus}.`,
    `DUREE DU PLAN : ${durationWeeks} semaines.${startDate ? ` Debut du programme : ${startDate}.` : ""}`,
    `JOURS AUTORISES : ${availableDays.join(", ")}.`,
    `CONTRAINTES : ${constraints}.`,
    `NIVEAU DETECTE : ${profileAnalysis.level}. ${profileAnalysis.summary}`,
    `ALLURES CIBLES ESTIMEES : ${profileAnalysis.paceGuidance}`,
    "Integre les allures cibles dans les consignes de chaque seance lorsque des donnees suffisantes sont disponibles. Elles sont des plages indicatives : privilegie le ressenti et ne propose pas une allure plus rapide que la plage indiquee.",
    "STRATEGIE LONG TERME : fais progresser la charge vers l'objectif de course, avec une semaine allegee si la duree du plan le justifie.",
    "PROFIL :",
    `- age : ${athlete?.age ?? "inconnu"}`,
    `- poids : ${athlete?.weightKg ?? "inconnu"} kg`,
    `- objectif hebdomadaire actuel : ${athlete?.weeklyGoal ?? "inconnu"} seances`,
    "COURSES RECENTES :",
    formatRuns(athlete?.recentRuns),
  ].join("\n");
}

const SESSION_TYPES = new Set(["easy_run", "intervals", "tempo", "long_run", "recovery", "rest"]);
const INTENSITIES = new Set(["easy", "moderate", "hard", "rest"]);

export function validateTrainingPlan(plan, availableDays, durationWeeks) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { valid: false, error: "Le plan n'est pas un objet JSON." };
  }

  const allowedPlanKeys = new Set(["title", "goal", "durationWeeks", "weeks", "safetyNote"]);
  if (
    Object.keys(plan).some((key) => !allowedPlanKeys.has(key)) ||
    typeof plan.title !== "string" ||
    !TRAINING_GOALS[plan.goal] ||
    plan.durationWeeks !== durationWeeks ||
    typeof plan.safetyNote !== "string"
  ) {
    return { valid: false, error: "Les informations generales du plan sont invalides." };
  }

  if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 24) {
    return { valid: false, error: "La duree du plan est invalide." };
  }

  if (!Array.isArray(plan.weeks) || plan.weeks.length !== durationWeeks) {
    return { valid: false, error: "Le nombre de semaines est incoherent." };
  }

  const expectedWeeks = new Set(Array.from({ length: durationWeeks }, (_, index) => index + 1));
  for (const week of plan.weeks) {
    const allowedWeekKeys = new Set(["weekNumber", "sessions"]);
    if (
      !week ||
      typeof week !== "object" ||
      Object.keys(week).some((key) => !allowedWeekKeys.has(key)) ||
      !Number.isInteger(week.weekNumber) ||
      !expectedWeeks.delete(week.weekNumber)
    ) {
      return { valid: false, error: "Les numeros de semaine sont incoherents." };
    }
    if (!Array.isArray(week.sessions) || week.sessions.length === 0) {
      return { valid: false, error: "Une semaine ne contient aucune seance." };
    }

    const scheduledDays = new Set();
    for (const session of week.sessions) {
      const allowedSessionKeys = new Set([
        "day",
        "type",
        "durationMin",
        "distanceKm",
        "intensity",
        "instructions",
      ]);
      if (!availableDays.includes(session?.day)) {
        return { valid: false, error: "Une seance est planifiee un jour non disponible." };
      }
      if (scheduledDays.has(session.day)) {
        return { valid: false, error: "Deux seances sont planifiees le meme jour." };
      }
      scheduledDays.add(session.day);

      if (
        !session ||
        typeof session !== "object" ||
        Object.keys(session).some((key) => !allowedSessionKeys.has(key)) ||
        !SESSION_TYPES.has(session.type) ||
        !INTENSITIES.has(session.intensity) ||
        !Number.isInteger(session.durationMin) ||
        session.durationMin < 0 ||
        session.durationMin > 300 ||
        (session.distanceKm !== undefined && session.distanceKm !== null && typeof session.distanceKm !== "number") ||
        typeof session.instructions !== "string" ||
        !session.instructions.trim()
      ) {
        return { valid: false, error: "Le format d'une seance est invalide." };
      }
    }
  }

  return { valid: true };
}

export function buildFallbackTrainingPlan({ goal, durationWeeks, availableDays }) {
  const days = availableDays.slice(0, Math.min(3, availableDays.length));
  const weeks = Array.from({ length: durationWeeks }, (_, index) => {
    const duration = Math.min(60, 25 + index * 3);
    return {
      weekNumber: index + 1,
      sessions: days.map((day, dayIndex) => ({
        day,
        type: dayIndex === days.length - 1 ? "recovery" : "easy_run",
        durationMin: dayIndex === days.length - 1 ? Math.max(20, duration - 10) : duration,
        distanceKm: null,
        intensity: "easy",
        instructions: "Course facile a allure confortable. Reduisez ou arretez en cas de douleur.",
      })),
    };
  });

  return {
    title: `Plan ${TRAINING_GOALS[goal].label} progressif`,
    goal,
    durationWeeks,
    weeks,
    safetyNote: "Plan de secours general. Adaptez la charge a votre ressenti et consultez un professionnel en cas de douleur.",
  };
}
