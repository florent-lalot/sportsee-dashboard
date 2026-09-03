"use client";

import { useMemo } from "react";
import { useUser } from "@/context/UserContext";

import { summarize } from "@/models/activityModel";
import { useUserActivity } from "@/hooks/useUserActivity";
import { toISODate } from "@/utils/dateRange";

import { formatHeight, splitDuration } from "@/models/userModel";
import ProfileCard from "@/components/ProfileCard/ProfileCard";
import StatCard from "@/components/StatCard/StatCard";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();

  // Historique complet : de l'inscription à aujourd'hui.
  const today = useMemo(() => toISODate(new Date()), []);
  const { sessions } = useUserActivity(user?.createdAt, today);
  const stats = useMemo(() => summarize(sessions), [sessions]);

  if (userError)
    return (
      <p className={styles.stateError} role="alert">
        {userError}
      </p>
    );
  if (isUserLoading || !user)
    return <p className={styles.loading}>Chargement…</p>;

  const duration = splitDuration(user.stats.totalDurationMin);

  return (
    <div className={styles.layout} data-page="profile">
      <div className={styles.left}>
        <ProfileCard user={user} compact />

        <section className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Votre profil</h2>

          <ul className={styles.infoList}>
            <li>Âge : {user.age}</li>
            <li>Genre : {user.gender ?? "non renseigné"}</li>
            <li>Taille : {formatHeight(user.heightCm)}</li>
            <li>Poids : {user.weightKg}kg</li>
          </ul>
        </section>
      </div>

      <div className={styles.right}>
        <h2 className={styles.sectionTitle}>Vos statistiques</h2>
        <p className={styles.sectionSubtitle}>depuis le {user.memberSince}</p>

        <div className={styles.statGrid}>
          <StatCard
            filled
            label="Temps total couru"
            value={`${duration.hours}h`}
            unit={`${duration.minutes}min`}
          />
          <StatCard
            filled
            label="Calories brûlées"
            value={stats.calories}
            unit="cal"
          />
          <StatCard
            filled
            label="Distance totale parcourue"
            value={Math.round(user.stats.totalDistanceKm)}
            unit="km"
          />
          <StatCard
            filled
            label="Nombre de jours de repos"
            value={stats.restDays}
            unit="jours"
          />
          <StatCard
            filled
            label="Nombre de sessions"
            value={user.stats.totalSessions}
            unit="sessions"
          />
        </div>
      </div>
    </div>
  );
}
