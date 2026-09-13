import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_KEY } from "@/config/auth";

/** Le JWT reste inaccessible au navigateur : seul l'etat de session est expose. */
export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({ authenticated: Boolean(cookieStore.get(TOKEN_KEY)?.value) });
}
