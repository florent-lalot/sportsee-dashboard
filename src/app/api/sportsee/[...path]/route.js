import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_KEY } from "@/config/auth";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/**
 * Le navigateur envoie le cookie HttpOnly a Next.js. Seul ce proxy serveur
 * lit ensuite le JWT pour authentifier l'appel vers l'API SportSee.
 */
export async function GET(request, { params }) {
  const { path } = await params;
  const token = (await cookies()).get(TOKEN_KEY)?.value;

  if (!token) {
    return NextResponse.json({ error: "Session absente." }, { status: 401 });
  }

  if (!API_URL) {
    console.error("[api/sportsee] API_URL is not configured");
    return NextResponse.json({ error: "Le service de donnees n'est pas configure." }, { status: 500 });
  }

  // Le client transmet deja un chemin qui commence par /api (ex. /api/user-info).
  // Ne pas ajouter un second /api, sinon le backend retourne 404.
  const target = new URL(`/${path.join("/")}`, API_URL);
  target.search = request.nextUrl.search;

  let backendResponse;
  try {
    backendResponse = await fetch(target, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Serveur injoignable." }, { status: 503 });
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      "Content-Type": backendResponse.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
