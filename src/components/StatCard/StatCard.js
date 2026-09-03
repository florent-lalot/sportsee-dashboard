import styles from "./StatCard.module.css";

/**
 * Carte chiffrée réutilisable.
 * @param {boolean} filled - fond bleu plein (page profil) au lieu de blanc
 * @param {"primary"|"accent"} tone - couleur de la valeur, variante blanche seule
 */
export default function StatCard({ label, value, unit, tone = "primary", filled = false }) {
  return (
    <section className={`${styles.card} ${filled ? styles.filled : ""}`}>
      <p className={styles.label}>{label}</p>
      <p className={`${styles.value} ${tone === "accent" ? styles.accent : ""}`}>
        {value} <span className={styles.unit}>{unit}</span>
      </p>
    </section>
  );
}
