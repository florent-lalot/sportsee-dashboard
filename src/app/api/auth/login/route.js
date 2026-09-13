import { NextResponse } from "next/server";
import { TOKEN_KEY } from "@/config/auth";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Le JSON envoye est invalide." }, { status: 400 });
  }

  if (!credentials?.username || !credentials?.password) {
    return NextResponse.json({ error: "Nom d'utilisateur et mot de passe requis." }, { status: 400 });
  }

  if (!API_URL) {
    console.error("[api/auth/login] API_URL is not configured");
    return NextResponse.json({ error: "Le service de connexion n'est pas configure." }, { status: 500 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: credentials.username, password: credentials.password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Le serveur est indisponible, reessayez plus tard." }, { status: 503 });
  }

  if (!backendResponse.ok) {
    const message = backendResponse.status === 401
      ? "Identifiants incorrects."
      : backendResponse.status === 400
        ? "Nom d'utilisateur et mot de passe requis."
        : "Le serveur est indisponible, reessayez plus tard.";
    return NextResponse.json({ error: message }, { status: backendResponse.status });
  }

  const data = await backendResponse.json();
  if (typeof data?.token !== "string" || !data.token) {
    console.error("[api/auth/login] Backend response has no token");
    return NextResponse.json({ error: "Reponse de connexion invalide." }, { status: 502 });
  }

  const response = NextResponse.json({ userId: data.userId ?? null });
  response.cookies.set(TOKEN_KEY, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
