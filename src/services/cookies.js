import Cookies from "js-cookie";
import { TOKEN_KEY } from "@/config/auth";

/** Stocke le token. Durée alignée sur celle du JWT (24 h). */
export const setToken = (token) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 1, // 1 jour
    sameSite: "strict", // non envoyé depuis un autre site → anti-CSRF
    path: "/", // disponible sur toutes les routes
  });
};

export const getToken = () => Cookies.get(TOKEN_KEY);

export const removeToken = () => Cookies.remove(TOKEN_KEY, { path: "/" });
