"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo/Logo";
import { ROUTES } from "@/config/routes";
import styles from "./page.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.left}>
        <div className={styles.logo}>
          <Logo />
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>
            Transformez
            <br />
            vos stats en résultats
          </h1>

          <h2 className={styles.subtitle}>Se connecter</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="username">Adresse e-mail</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <a href="#" className={styles.forgot}>
            Mot de passe oublié ?
          </a>
        </div>
      </section>

      <aside className={styles.right}>
        <Image
          src="/running.jpg"
          alt=""
          fill
          priority
          sizes="56vw"
          className={styles.photo}
        />
        <p className={styles.caption}>
          Analysez vos performances en un clin d&apos;œil, suivez vos progrès
          et atteignez vos objectifs.
        </p>
      </aside>
    </div>
  );
}
