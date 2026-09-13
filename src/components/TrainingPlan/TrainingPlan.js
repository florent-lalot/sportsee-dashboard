"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./TrainingPlan.module.css";

const GOALS = [
  { value: "5k", label: "Course de 5 km" },
  { value: "10k", label: "Course de 10 km" },
  { value: "half_marathon", label: "Semi-marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "free", label: "Entrainement libre" },
];

const TYPE_LABELS = {
  easy_run: "Course facile",
  intervals: "Fractionne",
  tempo: "Allure tempo",
  long_run: "Sortie longue",
  recovery: "Recuperation",
  rest: "Repos",
};
const INTENSITY_LABELS = {
  easy: "Facile",
  moderate: "Moderee",
  hard: "Intense",
  rest: "Repos",
};

function formatRecentRuns(sessions) {
  return [...sessions]
    .sort((first, second) => second.date - first.date)
    .slice(0, 10)
    .map((session) => ({
      date: session.isoDate,
      distanceKm: session.distanceKm,
      durationMin: session.durationMin,
      averageHeartRate: session.heartRate.average || null,
    }));
}

function retryAfterFrom(response, data) {
  const value = Number(data.retryAfter ?? response.headers.get("retry-after"));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 30;
}

function normalizeStartDate(value) {
  const match = String(value).trim().match(/^(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4}))$/);
  if (!match) return null;

  const [, isoYear, isoMonth, isoDay, frenchDay, frenchMonth, frenchYear] = match;
  const year = Number(isoYear || frenchYear);
  const month = Number(isoMonth || frenchMonth);
  const day = Number(isoDay || frenchDay);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function TrainingIcon({ variant }) {
  return (
    <span
      className={`${styles.heroIcon} ${styles[variant]}`}
      aria-hidden="true"
    />
  );
}

export default function TrainingPlan({ user, sessions }) {
  const [step, setStep] = useState("intro");
  const [goal, setGoal] = useState("10k");
  const [startDate, setStartDate] = useState("");
  const availableDays = ["Mardi", "Jeudi", "Samedi"];
  const constraints = "Aucune contrainte indiquee.";
  const [plan, setPlan] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const athlete = useMemo(
    () => ({
      age: user?.age ?? null,
      weightKg: user?.weightKg ?? null,
      weeklyGoal: user?.weeklyGoal ?? null,
      recentRuns: formatRecentRuns(sessions),
    }),
    [sessions, user],
  );

  const generatePlan = async (event) => {
    event.preventDefault();
    if (cooldownSeconds > 0) return;
    setError("");
    setWarning("");
    setRecommendation(null);

    if (!availableDays.length) {
      setError("Selectionnez au moins un jour disponible.");
      return;
    }
    if (!startDate) {
      setError("Indiquez la date de debut du programme.");
      return;
    }
    const normalizedStartDate = normalizeStartDate(startDate);
    if (!normalizedStartDate) {
      setError("Indiquez une date valide au format JJ/MM/AAAA.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/training-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          startDate: normalizedStartDate,
          durationWeeks: 6,
          availableDays,
          constraints,
          athlete,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.plan) {
        if (response.status === 429) {
          setCooldownSeconds(retryAfterFrom(response, data));
        }
        throw new Error(data.error || "La generation du plan a echoue.");
      }

      setPlan(data.plan);
      setStartDate(normalizedStartDate);
      setWarning(data.warning || "");
      setRecommendation(data.recommendation || null);
      setExpandedWeek(data.plan.weeks[0]?.weekNumber ?? null);
      setStep("plan");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Le service est indisponible.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCalendar = async () => {
    setError("");
    setIsDownloading(true);
    try {
      const response = await fetch("/api/training-plan/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, startDate }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Le calendrier n'a pas pu etre genere.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sportsee-plan.ics";
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Le calendrier est indisponible.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (step === "intro") {
    return (
      <section key="intro" className={styles.card} aria-labelledby="training-plan-title">
        <TrainingIcon variant="calendarIcon" />
        <h2 id="training-plan-title">
          Créez votre planning d&apos;entraînement intelligent
        </h2>
        <p>
          Notre IA vous aide a bâtir un planning 100% personnalisé selon vos
          objectifs, votre niveau et votre emploi du temps.
        </p>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setStep("goal")}
        >
          Commencer
        </button>
      </section>
    );
  }

  if (step === "goal") {
    return (
      <section
        key="goal"
        className={styles.card}
        aria-labelledby="training-goal-title"
      >
        <TrainingIcon variant="goalIcon" />
        <h2 id="training-goal-title">Quel est votre objectif principal ?</h2>
        <p>Choisissez l&apos;objectif qui vous motive le plus</p>
        <div className={`${styles.form} ${styles.goalForm}`}>
          <label>
            Objectif
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
            >
              {GOALS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setStep("config")}
            >
              Suivant
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (step === "config") {
    return (
      <section
        key="config"
        className={`${styles.card} ${styles.configCard}`}
        aria-labelledby="training-config-title"
      >
        <TrainingIcon variant="calendarIcon" />
        <h2 id="training-config-title">
          Quand souhaitez-vous commencer votre programme ?
        </h2>
        <p>
          Générez un programme de six semaines à partir de la date de votre
          choix
        </p>
        <form
          className={`${styles.form} ${styles.configForm}`}
          onSubmit={generatePlan}
        >
          <label>
            Date de début
            <input
              type="text"
              inputMode="numeric"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={styles.dateInput}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {cooldownSeconds > 0 && (
            <p className={styles.loading} role="status">
              Nouvelle generation possible dans {cooldownSeconds} secondes.
            </p>
          )}
          {isLoading && (
            <p className={styles.loading} role="status">
              Le plan est en cours de generation...
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setStep("goal")}
              aria-label="Retour au choix de l'objectif"
            >
              ←
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isLoading || cooldownSeconds > 0}
            >
              {isLoading
                ? "Generation..."
                : cooldownSeconds > 0
                  ? `Reessayer dans ${cooldownSeconds} s`
                  : "Generer mon planning"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section
      key="plan"
      className={`${styles.card} ${styles.planCard}`}
      aria-labelledby="plan-title"
    >
      <h2 id="plan-title">Votre planning de la semaine</h2>
      <p>Important pour définir un programme adapté</p>
      {warning && (
        <p className={styles.warning} role="status">
          {warning}
        </p>
      )}
      {recommendation && (
        <aside
          className={styles.recommendation}
          aria-label="Objectif recommande"
        >
          <h3>Objectif recommande : course de 5 km</h3>
          <p>{recommendation.explanation}</p>
          <ul>
            {recommendation.progression.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.weeks}>
        {plan.weeks.map((week) => {
          const isExpanded = expandedWeek === week.weekNumber;
          return (
            <article key={week.weekNumber} className={styles.week}>
              <button
                type="button"
                className={styles.weekHeader}
                onClick={() =>
                  setExpandedWeek(isExpanded ? null : week.weekNumber)
                }
                aria-expanded={isExpanded}
              >
                <span>Semaine {week.weekNumber}</span>
                <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
              </button>
              {isExpanded && (
                <div className={styles.sessions}>
                  {week.sessions.map((session, index) => (
                    <article
                      key={`${session.day}-${index}`}
                      className={styles.session}
                    >
                      <p className={styles.sessionDay}>{session.day}</p>
                      <h3>{TYPE_LABELS[session.type] ?? session.type}</h3>
                      <p>{session.instructions}</p>
                      <div className={styles.sessionMeta}>
                        <span>{session.durationMin} min</span>
                        {session.distanceKm !== null &&
                          session.distanceKm !== undefined && (
                            <span>{session.distanceKm} km</span>
                          )}
                        <span>
                          {INTENSITY_LABELS[session.intensity] ??
                            session.intensity}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className={styles.planActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={downloadCalendar}
          disabled={isDownloading}
        >
          {isDownloading ? "Preparation..." : "Telecharger le calendrier"}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setPlan(null);
            setRecommendation(null);
            setStep("goal");
          }}
          disabled={cooldownSeconds > 0}
        >
          {cooldownSeconds > 0
            ? `Reessayer dans ${cooldownSeconds} s`
            : "Regenerer un programme"}
        </button>
      </div>
    </section>
  );
}
