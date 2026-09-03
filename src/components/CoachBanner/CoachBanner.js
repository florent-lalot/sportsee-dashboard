import styles from "./CoachBanner.module.css";

export default function CoachBanner({ onStart }) {
  return (
    <section className={styles.banner}>
      <p className={styles.text}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
          <path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
        </svg>
        Posez vos questions sur votre programme, vos performances ou vos
        objectifs.
      </p>

      <button type="button" className={styles.cta} onClick={onStart}>
        Lancer une conversation
      </button>
    </section>
  );
}
