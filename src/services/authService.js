/**
 * Authentifie un utilisateur via Next.js. La route serveur stocke le JWT dans
 * un cookie HttpOnly ; le token n'est jamais renvoye au navigateur.
 * @returns {Promise<{userId: string | null}>}
 */
export async function login(username, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Le serveur est indisponible, reessayez plus tard.");
  }

  return response.json();
}
