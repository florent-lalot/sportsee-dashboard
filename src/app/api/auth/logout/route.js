import { NextResponse } from "next/server";
import { TOKEN_KEY } from "@/config/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_KEY, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
