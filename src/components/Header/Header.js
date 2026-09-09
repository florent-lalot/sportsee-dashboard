"use client";

import Logo from "@/components/Logo/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChatModal } from "@/components/ChatModal/ChatModal";
import { ROUTES } from "@/config/routes";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { openChat } = useChatModal();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className={styles.header}>
      <Link href={ROUTES.DASHBOARD} className={styles.logo}>
        <Logo />
      </Link>

      <nav className={styles.nav} aria-label="Navigation principale">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${pathname === href ? styles.active : ""}`}
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}

        <button
          type="button"
          className={`${styles.link} ${styles.coachButton}`}
          onClick={openChat}
          aria-haspopup="dialog"
        >
          Coach AI
        </button>

        <Link
          href={ROUTES.PROFILE}
          className={`${styles.link} ${pathname === ROUTES.PROFILE ? styles.active : ""}`}
          aria-current={pathname === ROUTES.PROFILE ? "page" : undefined}
        >
          Mon profil
        </Link>

        <span className={styles.separator} aria-hidden="true" />

        <button type="button" onClick={handleLogout} className={styles.logout}>
          Se déconnecter
        </button>
      </nav>
    </header>
  );
}
