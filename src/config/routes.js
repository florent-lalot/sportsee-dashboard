/** Chemins de l'application, définis à un seul endroit. */
export const ROUTES = {
  LOGIN: "/",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
};

/** Routes accessibles sans authentification. */
export const PUBLIC_ROUTES = [ROUTES.LOGIN];

/** Routes nécessitant un token valide. */
export const PROTECTED_ROUTES = [ROUTES.DASHBOARD, ROUTES.PROFILE];
