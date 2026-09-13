import { NextResponse } from "next/server";
import {
  buildFallbackTrainingPlan,
  buildTrainingPlanPrompt,
  analyzeRunningProfile,
  TRAINING_GOALS,
  validateTrainingPlan,
} from "@/prompts/trainingPlanPrompts";

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const AVAILABLE_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const REQUEST_TIMEOUT_MS = 30_000;
const PLAN_DURATION_WEEKS = 6;
const DEFAULT_RETRY_AFTER_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 300;

function errorResponse(error, status) {
  return NextResponse.json({ error }, { status });
}

function optionalNumber(value, min, max) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function sanitizeAthlete(athlete) {
  if (!athlete || typeof athlete !== "object" || Array.isArray(athlete)) return {};
  const recentRuns = Array.isArray(athlete.recentRuns) ? athlete.recentRuns.slice(0, 10) : [];

  return {
    age: optionalNumber(athlete.age, 13, 100),
    weightKg: optionalNumber(athlete.weightKg, 30, 300),
    weeklyGoal: optionalNumber(athlete.weeklyGoal, 0, 14),
    recentRuns: recentRuns
      .filter((run) => /^\d{4}-\d{2}-\d{2}$/.test(run?.date ?? ""))
      .map((run) => ({
        date: run.date,
        distanceKm: optionalNumber(run.distanceKm, 0, 500) ?? 0,
        durationMin: optionalNumber(run.durationMin, 0, 1_440) ?? 0,
      })),
  };
}

function calculateDurationWeeks(startDate) {
  if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return null;
  return PLAN_DURATION_WEEKS;
}

function validateRequest(body) {
  if (!body || !TRAINING_GOALS[body.goal]) return null;
  if (!Array.isArray(body.availableDays) || body.availableDays.length === 0 || body.availableDays.length > 7) return null;

  const availableDays = [...new Set(body.availableDays)];
  if (availableDays.some((day) => !AVAILABLE_DAYS.includes(day))) return null;

  const constraints = typeof body.constraints === "string" ? body.constraints.trim().slice(0, 500) : "";
  const durationWeeks = calculateDurationWeeks(body.startDate);
  if (!durationWeeks) return null;

  return {
    goal: body.goal,
    startDate: body.startDate,
    durationWeeks,
    availableDays,
    constraints: constraints || "Aucune contrainte indiquee.",
    athlete: sanitizeAthlete(body.athlete),
  };
}

function fallbackResponse(data, warning) {
  return NextResponse.json({
    plan: buildFallbackTrainingPlan(data),
    source: "fallback",
    warning,
  });
}

function getRetryAfterSeconds(response) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(retryAfter) || retryAfter <= 0) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(Math.ceil(retryAfter), MAX_RETRY_AFTER_SECONDS);
}

function rateLimitResponse(mistralResponse) {
  const retryAfter = getRetryAfterSeconds(mistralResponse);
  return NextResponse.json(
    {
      error: `Trop de demandes au service IA. Reessayez dans ${retryAfter} secondes.`,
      retryAfter,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

function marathonSafetyResponse(data) {
  const adjustedData = { ...data, goal: "5k" };
  return NextResponse.json({
    plan: buildFallbackTrainingPlan(adjustedData),
    source: "safety_adjustment",
    warning: "Un marathon en 6 semaines est trop ambitieux pour votre niveau actuel. Un plan 5 km progressif est propose a la place.",
    recommendation: {
      proposedGoal: "5k",
      explanation: "L'objectif prioritaire est de construire une base d'endurance sans augmenter brutalement le volume de course.",
      progression: [
        "Semaines 1 et 2 : alterner course facile et marche si necessaire.",
        "Semaines 3 et 4 : augmenter progressivement le temps de course continue.",
        "Semaines 5 et 6 : consolider une sortie facile vers 5 km, selon le ressenti.",
        "Ensuite : viser 10 km, puis augmenter le volume sur plusieurs mois avant un projet marathon.",
      ],
    },
  });
}

function extractJsonContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text?.value ?? part?.text ?? part?.content ?? "";
      })
      .join("");
  }
  if (content && typeof content === "object") return JSON.stringify(content);
  return "";
}

function parsePlanContent(content) {
  const cleanedContent = extractJsonContent(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const firstBrace = cleanedContent.indexOf("{");
  const lastBrace = cleanedContent.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace
    ? cleanedContent.slice(firstBrace, lastBrace + 1)
    : cleanedContent;
  return JSON.parse(jsonText);
}

function normalizePlanGoal(goal) {
  const normalized = String(goal ?? "").trim().toLowerCase();
  const aliases = {
    "course de 5 km": "5k",
    "5 km": "5k",
    "course de 10 km": "10k",
    "10 km": "10k",
    "semi-marathon": "half_marathon",
    marathon: "marathon",
    "entrainement libre": "free",
  };
  return aliases[normalized] ?? goal;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Le JSON envoye est invalide.", 400);
  }

  const data = validateRequest(body);
  if (!data) {
    return errorResponse("Objectif, date, duree ou jours de disponibilite invalides.", 400);
  }

  const profile = analyzeRunningProfile(data.athlete);
  if (
    data.goal === "marathon" &&
    (profile.level === "debutant" || profile.level === "debutant_par_defaut")
  ) {
    console.info("[api/training-plan/generate] Unsafe marathon goal adjusted", {
      detectedLevel: profile.level,
    });
    return marathonSafetyResponse(data);
  }

  if (!process.env.MISTRAL_API_KEY) {
    return fallbackResponse(data, "Le service IA n'est pas configure. Un plan general est propose.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const mistralResponse = await fetch(MISTRAL_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
        temperature: 0.2,
        max_tokens: 3_500,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: buildTrainingPlanPrompt(data) }],
      }),
      signal: controller.signal,
    });

    if (!mistralResponse.ok) {
      console.error("[api/training-plan/generate] Mistral request failed", { status: mistralResponse.status });
      if (mistralResponse.status === 429) {
        return rateLimitResponse(mistralResponse);
      }
      return fallbackResponse(data, "Le service IA est temporairement indisponible. Un plan general est propose.");
    }

    const payload = await mistralResponse.json();
    const content = payload.choices?.[0]?.message?.content;
    if (payload.choices?.[0]?.finish_reason === "length") {
      console.error("[api/training-plan/generate] Mistral response was truncated");
      return fallbackResponse(data, "La reponse IA a ete tronquee. Un plan general est propose.");
    }
    let plan;
    try {
      plan = parsePlanContent(content);
    } catch {
      console.error("[api/training-plan/generate] Mistral returned non-parseable JSON", {
        contentType: Array.isArray(content) ? "array" : typeof content,
      });
      return fallbackResponse(data, "La reponse IA est invalide. Un plan general est propose.");
    }

    if (plan && typeof plan === "object" && !Array.isArray(plan)) {
      plan.goal = TRAINING_GOALS[normalizePlanGoal(plan.goal)] ? normalizePlanGoal(plan.goal) : data.goal;
      plan.durationWeeks = data.durationWeeks;
    }

    const validation = validateTrainingPlan(plan, data.availableDays, data.durationWeeks);
    if (!validation.valid) {
      console.error("[api/training-plan/generate] Invalid plan", { reason: validation.error });
      return fallbackResponse(
        data,
        `Le plan IA est invalide : ${validation.error} Un plan general est propose.`,
      );
    }

    console.info("[api/training-plan/generate] Plan generated", {
      goal: data.goal,
      durationWeeks: data.durationWeeks,
      availableDaysCount: data.availableDays.length,
    });
    return NextResponse.json({ plan, source: "mistral" });
  } catch (error) {
    const warning = error instanceof Error && error.name === "AbortError"
      ? "Le service IA a mis trop de temps a repondre. Un plan general est propose."
      : "Le service IA est indisponible. Un plan general est propose.";
    console.error("[api/training-plan/generate] Unexpected error", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return fallbackResponse(data, warning);
  } finally {
    clearTimeout(timeoutId);
  }
}
