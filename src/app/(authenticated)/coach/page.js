"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MAX_VISIBLE_MESSAGES = 12;

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Bonjour ! Je suis votre coach IA. Posez-moi une question sur vos entraînements, vos objectifs ou votre récupération.",
};

function keepRecentMessages(messages) {
  return messages.slice(-MAX_VISIBLE_MESSAGES);
}

export default function CoachPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const lastMessageRef = useRef(null);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || isLoading) return;

    setMessages((currentMessages) =>
      keepRecentMessages([...currentMessages, { role: "user", content: message }]),
    );
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      if (typeof data.message !== "string" || !data.message.trim()) {
        throw new Error("Le coach IA a retourné une réponse invalide.");
      }

      setMessages((currentMessages) =>
        keepRecentMessages([
          ...currentMessages,
          { role: "assistant", content: data.message },
        ]),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Le coach IA est indisponible. Réessayez plus tard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.page} aria-labelledby="coach-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>SPORTSEE AI</p>
          <h1 id="coach-title">Votre coach virtuel</h1>
        </div>
        <p className={styles.intro}>
          Des conseils personnalisés pour accompagner vos entraînements.
        </p>
      </header>

      <div className={styles.chat}>
        <div
          className={styles.messages}
          aria-label="Conversation avec le coach IA"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {messages.map((chatMessage, index) => (
            <article
              key={`${chatMessage.role}-${index}`}
              className={`${styles.message} ${
                chatMessage.role === "user" ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <p className={styles.author}>
                {chatMessage.role === "user" ? "Vous" : "Coach SportSee"}
              </p>
              <p>{chatMessage.content}</p>
            </article>
          ))}

          {isLoading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <p className={styles.author}>Coach SportSee</p>
              <p className={styles.loading}>Le coach prépare sa réponse…</p>
            </div>
          )}
          <div ref={lastMessageRef} />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <form className={styles.composer} onSubmit={handleSubmit}>
          <label className={styles.srOnly} htmlFor="coach-message">
            Votre message au coach IA
          </label>
          <input
            id="coach-message"
            className={styles.input}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Écrivez votre message…"
            maxLength={2000}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            className={styles.submit}
            type="submit"
            disabled={isLoading || !input.trim()}
          >
            <span>{isLoading ? "Envoi…" : "Envoyer"}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 11.5 21 3l-6.5 18-3-7-8.5-2.5Zm9.1 1.1 4.8-5.3-7.6 4 2.8.8Z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
