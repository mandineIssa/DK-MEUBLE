import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "dk_customer_token";
const MAX_AGE = 60 * 60 * 24 * 30;

export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ message: "Token manquant." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
