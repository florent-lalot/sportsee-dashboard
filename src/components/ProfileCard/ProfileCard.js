import Image from "next/image";
import styles from "./ProfileCard.module.css";

export default function ProfileCard({ user, compact = false }) {
  if (!user) return null;

  return (
    <section className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.identity}>
        <div className={styles.photoWrap}>
          <Image
            src={user.pictureUrl}
            alt=""
            width={120}
            height={120}
            className={styles.photo}
          />
        </div>
        <div className={styles.info}>
          <h2 className={styles.name}>{user.fullName}</h2>
          <p className={styles.since}>Membre depuis le {user.memberSince}</p>
        </div>
      </div>

      {!compact && (
      <div className={styles.right}>
          <p className={styles.label}>Distance totale parcourue</p>
  
          <p className={styles.tile}>
            <Image
              src="/distance-icon.png"
              alt=""
              width={39}
              height={39}
              className={styles.icon}
            />
            {Math.round(user.stats.totalDistanceKm)} km
          </p>
        </div>
      )}
    </section>
  );
}
