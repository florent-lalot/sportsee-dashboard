/** Erreur API : porte le code HTTP en plus du message. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Les statuts indiquant une session absente, expiree ou invalide. */
export const isSessionExpired = (status) => status === 401 || status === 403;

function messageFor(status) {
  switch (status) {
    case 400:
      return "Requete invalide";
    case 401:
      return "Votre session a expire, veuillez vous reconnecter";
    case 403:
      return "Acces refuse";
    case 404:
      return "Donnees introuvables";
    default:
      return "Le serveur est indisponible, reessayez plus tard";
  }
}

/**
 * Appel authentifie vers le proxy Next.js. Le navigateur transmet le cookie
 * HttpOnly au proxy ; le JWT n'est jamais accessible dans ce code client.
 */
export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api/sportsee${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Serveur injoignable, verifiez qu'il est demarre", 0);
  }

  if (!response.ok) {
    throw new ApiError(messageFor(response.status), response.status);
  }

  return response.json();
}
