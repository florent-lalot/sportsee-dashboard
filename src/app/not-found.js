import Link from "next/link";
import Logo from "@/components/Logo/Logo";
import { ROUTES } from "@/config/routes";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.logo}>
        <Logo />
      </div>

      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Cette page n&apos;existe pas</h1>
        <p className={styles.text}>
          Le lien est peut-être erroné, ou la page a été déplacée.
        </p>

        <Link href={ROUTES.DASHBOARD} className={styles.link}>
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
