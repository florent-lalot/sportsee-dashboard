"use client";

import { useMemo, useState } from "react";
import {
  formatPeriod,
  formatFullRange,
  lastWeek,
  summarize,
  toWeeklyDistance,
  toWeeklyHeartRate,
} from "@/models/activityModel";
import { FALLBACK_WEEKLY_GOAL } from "@/models/userModel";
import WeeklyDistanceChart from "@/components/charts/WeeklyDistanceChart/WeeklyDistanceChart";
import HeartRateChart from "@/components/charts/HeartRateChart/HeartRateChart";
import WeeklyGoalChart from "@/components/charts/WeeklyGoalChart/WeeklyGoalChart";
import TrainingPlan from "@/components/TrainingPlan/TrainingPlan";
import CoachBanner from "@/components/CoachBanner/CoachBanner";
import { useChatModal } from "@/components/ChatModal/ChatModal";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import StatCard from "@/components/StatCard/StatCard";
import { useUser } from "@/context/UserContext";
import { useUserActivity } from "@/hooks/useUserActivity";
import { lastWeeksRange, weeksAgo } from "@/utils/dateRange";
import styles from "./page.module.css";

/**
 * Historique charge en UNE requete. Les fleches des graphiques naviguent
 * ensuite dans ce tableau, sans nouvel appel reseau : la navigation est
 * instantanee et le serveur n'est sollicite qu'une fois.
 */
const HISTORY_WEEKS = 12;
const KM_WEEKS = 4;

const MAX_KM_PAGE = HISTORY_WEEKS / KM_WEEKS - 1; // 2 pages de 4 semaines
const MAX_WEEK_PAGE = HISTORY_WEEKS - 1; // 11 semaines en arriere

export default function DashboardPage() {
  const { openChat } = useChatModal();
  const { startWeek, endWeek } = useMemo(
    () => lastWeeksRange(HISTORY_WEEKS),
    [],
  );
  const { sessions, isLoading, error } = useUserActivity(startWeek, endWeek);
  const { user } = useUser();

  // Page 0 = periode la plus recente ; on remonte le temps en incrementant.
  const [kmPage, setKmPage] = useState(0);
  const [weekPage, setWeekPage] = useState(0);

  // Graphique km : 4 semaines glissantes
  const kmEnd = useMemo(() => weeksAgo(kmPage * KM_WEEKS), [kmPage]);
  const weeks = useMemo(
    () => toWeeklyDistance(sessions, KM_WEEKS, kmEnd),
    [sessions, kmEnd],
  );
  const averageKm = weeks.length
    ? Math.round(weeks.reduce((sum, week) => sum + week.km, 0) / weeks.length)
    : 0;

  // Graphique BPM : une semaine
  const bpmEnd = useMemo(() => weeksAgo(weekPage), [weekPage]);
  const bpmWeek = useMemo(
    () => lastWeek(sessions, 7, bpmEnd),
    [sessions, bpmEnd],
  );
  const heartRate = useMemo(
    () => toWeeklyHeartRate(bpmWeek.sessions),
    [bpmWeek],
  );
  const bpmStats = useMemo(() => summarize(bpmWeek.sessions), [bpmWeek]);

  // Section "Cette semaine" : toujours la semaine en cours, quelle que soit
  // la periode affichee par les graphiques du dessus.
  const today = useMemo(() => weeksAgo(0), []);
  const currentWeek = useMemo(
    () => lastWeek(sessions, 7, today),
    [sessions, today],
  );
  const currentStats = useMemo(
    () => summarize(currentWeek.sessions),
    [currentWeek],
  );

  return (
    <>
      {/* Ce bloc ne dépend que du profil : il reste visible pendant le chargement. */}
      <div className={styles.top}>
        <CoachBanner onStart={openChat} />
        <ProfileCard user={user} />
      </div>

      {isLoading && (
        <p className={styles.state}>Chargement de vos activités…</p>
      )}

      {error && (
        <p className={styles.stateError} role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <p className={styles.state}>
          Aucune séance enregistrée sur cette période.
        </p>
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Vos dernières performances</h2>

          <div className={styles.grid}>
            <WeeklyDistanceChart
              data={weeks}
              averageKm={averageKm}
              periodLabel={formatPeriod(weeks)}
              onPrevious={() =>
                setKmPage((page) => Math.min(page + 1, MAX_KM_PAGE))
              }
              onNext={() => setKmPage((page) => Math.max(page - 1, 0))}
              canPrevious={kmPage < MAX_KM_PAGE}
              canNext={kmPage > 0}
            />
            <HeartRateChart
              data={heartRate}
              averageBpm={bpmStats.averageHeartRate}
              periodLabel={bpmWeek.label}
              onPrevious={() =>
                setWeekPage((page) => Math.min(page + 1, MAX_WEEK_PAGE))
              }
              onNext={() => setWeekPage((page) => Math.max(page - 1, 0))}
              canPrevious={weekPage < MAX_WEEK_PAGE}
              canNext={weekPage > 0}
            />
          </div>

          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleWeek}`}>
            Cette semaine
          </h2>
          <p className={styles.sectionSubtitle}>
            {formatFullRange(currentWeek.start, currentWeek.end)}
          </p>

          <div className={`${styles.grid} ${styles.gridWeek}`}>
            <WeeklyGoalChart
              done={currentStats.sessionCount}
              goal={user?.weeklyGoal ?? FALLBACK_WEEKLY_GOAL}
            />

            <div className={styles.statColumn}>
              <StatCard
                label="Durée d'activité"
                value={currentStats.durationMin}
                unit="minutes"
              />
              <StatCard
                label="Distance"
                value={currentStats.distanceKm}
                unit="kilomètres"
                tone="accent"
              />
            </div>
          </div>

          <TrainingPlan user={user} sessions={sessions} />
        </>
      )}
    </>
  );
}
