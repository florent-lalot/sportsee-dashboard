import { getToken } from "@/services/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Erreur API : porte le code HTTP en plus du message. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Statuts signifiant "la session n'est plus valable".
 * Ce backend renvoie 401 quand aucun token n'est envoye,
 * et 403 quand le token est present mais invalide OU expire
 * (voir Backend/app/middleware.js).
 */
export const isSessionExpired = (status) => status === 401 || status === 403;

function messageFor(status) {
  switch (status) {
    case 400:
      return "Requête invalide";
    case 401:
      return "Votre session a expiré, veuillez vous reconnecter";
    case 403:
      return "Accès refusé";
    case 404:
      return "Données introuvables";
    default:
      return "Le serveur est indisponible, réessayez plus tard";
  }
}

/**
 * Appel authentifié à l'API SportSee.
 * @param {string} path  ex. "/api/user-info"
 * @returns {Promise<any>} le JSON de la réponse
 * @throws {ApiError}
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    // fetch ne rejette que si le réseau échoue (backend éteint)
    throw new ApiError("Serveur injoignable, vérifiez qu'il est démarré", 0);
  }

  if (!response.ok)
    throw new ApiError(messageFor(response.status), response.status);

  return response.json();
}
