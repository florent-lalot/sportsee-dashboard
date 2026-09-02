import { NextResponse } from "next/server";
import { ROUTES, PUBLIC_ROUTES } from "@/config/routes";
import { TOKEN_KEY } from "@/config/auth";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Page protégée sans token → retour à la connexion
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // Déjà connecté mais sur la page de connexion → direct au dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
