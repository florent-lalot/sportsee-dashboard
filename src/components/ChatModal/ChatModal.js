"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { getUserActivity } from "@/services/userService";
import { activityModel } from "@/models/activityModel";
import styles from "./ChatModal.module.css";

const SUGGESTIONS = [
  "Comment améliorer mon endurance ?",
  "Que signifie mon score de récupération ?",
  "Peux-tu m’expliquer mon dernier graphique ?",
];
const MAX_VISIBLE_MESSAGES = 12;
const MAX_HISTORY_MESSAGES = 6;
const ChatModalContext = createContext(null);

function keepRecentMessages(messages) {
  return messages.slice(-MAX_VISIBLE_MESSAGES);
}

function retryAfterFrom(response, data) {
  const value = Number(data.retryAfter ?? response.headers.get("retry-after"));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 30;
}

export function ChatModalProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);

  return (
    <ChatModalContext.Provider value={{ openChat }}>
      {children}
      {isChatOpen && <ChatModal onClose={closeChat} />}
    </ChatModalContext.Provider>
  );
}

export function useChatModal() {
  const context = useContext(ChatModalContext);
  if (context === null) {
    throw new Error("useChatModal doit être utilisé dans un <ChatModalProvider>");
  }
  return context;
}

export default function ChatModal({ onClose }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const inputRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [recentRuns, setRecentRuns] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    getUserActivity(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10))
      .then((data) => {
        if (cancelled) return;
        const latestRuns = activityModel(data)
          .sort((first, second) => second.date - first.date)
          .slice(0, 10)
          .map((run) => ({
            date: run.isoDate,
            distanceKm: run.distanceKm,
            durationMin: run.durationMin,
            averageHeartRate: run.heartRate.average || null,
          }));
        setRecentRuns(latestRuns);
      })
      .catch(() => {
        if (!cancelled) setRecentRuns([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const athlete = useMemo(
    () => ({
      age: user?.age ?? null,
      weightKg: user?.weightKg ?? null,
      weeklyGoal: user?.weeklyGoal ?? null,
      recentRuns,
    }),
    [recentRuns, user],
  );

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || isLoading || cooldownSeconds > 0) return;

    setMessages((current) => keepRecentMessages([...current, { role: "user", content: message }]));
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.slice(-MAX_HISTORY_MESSAGES),
          athlete,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || typeof data.message !== "string" || !data.message.trim()) {
        if (response.status === 429) {
          setCooldownSeconds(retryAfterFrom(response, data));
        }
        throw new Error(data.error || "Le coach IA est indisponible. Réessayez plus tard.");
      }

      setMessages((current) =>
        keepRecentMessages([...current, { role: "assistant", content: data.message }]),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Le coach IA est indisponible. Réessayez plus tard.",
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose}>
          Fermer <span aria-hidden="true">×</span>
        </button>

        <div className={styles.conversation} aria-live="polite" aria-busy={isLoading}>
          {messages.length === 0 ? (
            <h2 id="chat-title" className={styles.emptyTitle}>
              Posez vos questions sur votre programme,
              <br /> vos performances ou vos objectifs
            </h2>
          ) : (
            <div className={styles.thread}>
              {messages.map((chatMessage, index) => (
                <article
                  key={`${chatMessage.role}-${index}`}
                  className={`${styles.message} ${
                    chatMessage.role === "user" ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  {chatMessage.role === "assistant" && <p className={styles.author}>Coach AI</p>}
                  <p>{chatMessage.content}</p>
                  {chatMessage.role === "assistant" && (
                    <span className={styles.assistantBadge} aria-label="Coach IA">
                      <Image src="/coach-ai-avatar.png" alt="" width={32} height={32} />
                    </span>
                  )}
                  {chatMessage.role === "user" && (
                    <span className={styles.avatar} aria-label="Vous">
                      {user?.pictureUrl ? (
                        <Image
                          src={user.pictureUrl}
                          alt="Votre photo de profil"
                          width={34}
                          height={34}
                          className={styles.avatarImage}
                        />
                      ) : (
                        user?.firstName?.slice(0, 1) || "V"
                      )}
                    </span>
                  )}
                </article>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.assistantMessage} ${styles.typing}`}>
                  <span className={styles.coachIcon} aria-hidden="true">
                    <Image src="/coach-ai-avatar.png" alt="" width={32} height={32} />
                  </span>
                  <span className={styles.dots} aria-label="Le coach écrit">
                    <i /> <i /> <i />
                  </span>
                </div>
              )}
              <div ref={lastMessageRef} />
            </div>
          )}
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {cooldownSeconds > 0 && (
          <p className={styles.error} role="status">
            Nouveau message possible dans {cooldownSeconds} secondes.
          </p>
        )}

        <div className={styles.bottomArea}>
          <form className={styles.composer} onSubmit={handleSubmit}>
            <span className={styles.sparkle} aria-hidden="true">
              <Image src="/coach-ai-sparkle.png" alt="" width={28} height={28} />
            </span>
            <label className={styles.srOnly} htmlFor="chat-message">Votre message au coach IA</label>
            <input
              ref={inputRef}
              id="chat-message"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Comment puis-je vous aider ?"
              maxLength={2000}
              disabled={isLoading || cooldownSeconds > 0}
              autoComplete="off"
            />
            <button type="submit" disabled={isLoading || cooldownSeconds > 0 || !input.trim()} aria-label="Envoyer le message">
              ↑
            </button>
          </form>

          <div className={styles.suggestions} aria-label="Questions suggérées">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" disabled={isLoading || cooldownSeconds > 0} onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
