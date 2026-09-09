/**
 * Source des donnees.
 *   true  -> les donnees fictives de src/mocks (aucun appel reseau)
 *   false -> l'API reelle sur http://localhost:8000
 *
 * L'interrupteur n'est lu qu'a un seul endroit : src/services/userService.js.
 * Aucun composant, aucune page et aucun hook ne sait qu'il existe.
 */
export const USE_MOCKS = false;
