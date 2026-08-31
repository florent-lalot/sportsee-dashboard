const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Authentifie un utilisateur auprès de l'API.
 * @returns {Promise<{token: string, userId: string}>}
 * @throws {Error} si les identifiants sont refusés
 */
export async function login(username, password) {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Nom d'utilisateur et mot de passe requis");
    }
    if (response.status === 401) {
      throw new Error("Identifiants incorrects");
    }
    throw new Error("Le serveur est indisponible, réessayez plus tard");
  }

  return response.json();
}
