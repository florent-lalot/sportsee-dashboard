import LogoMark from "@/components/Logo/LogoMark";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copyright}>&copy;Sportsee Tous droits réservés</p>

        <div className={styles.right}>
          <nav className={styles.links} aria-label="Liens de bas de page">
            <a href="#">Conditions générales</a>
            <a href="#">Contact</a>
          </nav>
          <LogoMark size={20} className={styles.mark} />
        </div>
      </div>
    </footer>
  );
}
