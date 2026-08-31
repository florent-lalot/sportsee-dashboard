export const ROUTES = {
  LOGIN: "/",
  DASHBOARD: "/dashboard",
  COACH: "/coach",
  PROFILE: "/profile",
};

export const PUBLIC_ROUTES = [ROUTES.LOGIN];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.COACH,
  ROUTES.PROFILE,
];
