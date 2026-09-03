"use client";

import { useMemo } from "react";
import {
  formatPeriod,
  formatFullRange,
  lastWeek,
  summarize,
  toWeeklyDistance,
  toWeeklyHeartRate,
} from "@/models/activityModel";
import WeeklyDistanceChart from "@/components/charts/WeeklyDistanceChart/WeeklyDistanceChart";
import HeartRateChart from "@/components/charts/HeartRateChart/HeartRateChart";
import WeeklyGoalChart from "@/components/charts/WeeklyGoalChart/WeeklyGoalChart";
import CoachBanner from "@/components/CoachBanner/CoachBanner";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import StatCard from "@/components/StatCard/StatCard";
import { useUser } from "@/context/UserContext";
import { useUserActivity } from "@/hooks/useUserActivity";
import { lastWeeksRange } from "@/utils/dateRange";
import { DEFAULT_WEEKLY_GOAL } from "@/config/app";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { startWeek, endWeek } = useMemo(() => lastWeeksRange(4), []);
  const { sessions, isLoading, error } = useUserActivity(startWeek, endWeek);
  const { user } = useUser();

  // Graphique km : 4 semaines
  const weeks = useMemo(() => toWeeklyDistance(sessions, 4), [sessions]);
  const averageKm = weeks.length
    ? Math.round(weeks.reduce((sum, week) => sum + week.km, 0) / weeks.length)
    : 0;

  // Graphique BPM : la dernière semaine uniquement
  const week = useMemo(() => lastWeek(sessions), [sessions]);
  const heartRate = useMemo(() => toWeeklyHeartRate(week.sessions), [week]);
  const weekStats = useMemo(() => summarize(week.sessions), [week]);

  return (
    <>
      {/* Ce bloc ne dépend que du profil : il reste visible pendant le chargement. */}
      <div className={styles.top}>
        <CoachBanner />
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
            />
            <HeartRateChart
              data={heartRate}
              averageBpm={weekStats.averageHeartRate}
              periodLabel={week.label}
            />
          </div>

          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleWeek}`}>
            Cette semaine
          </h2>
          <p className={styles.sectionSubtitle}>
            {formatFullRange(week.start, week.end)}
          </p>

          <div className={`${styles.grid} ${styles.gridWeek}`}>
            <WeeklyGoalChart
              done={weekStats.sessionCount}
              goal={DEFAULT_WEEKLY_GOAL}
            />

            <div className={styles.statColumn}>
              <StatCard
                label="Durée d'activité"
                value={weekStats.durationMin}
                unit="minutes"
              />
              <StatCard
                label="Distance"
                value={weekStats.distanceKm}
                unit="kilomètres"
                tone="accent"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
