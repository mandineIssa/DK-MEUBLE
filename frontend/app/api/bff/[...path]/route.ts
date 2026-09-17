import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const COOKIE = "dk_customer_token";

type Ctx = { params: { path: string[] } };

async function proxy(req: NextRequest, ctx: Ctx) {
  const path = ctx.params.path?.join("/") || "";
  const url = `${API_URL}/api/${path}${req.nextUrl.search}`;

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const body = await req.text();
    if (body) init.body = body;
  } else if (req.method === "DELETE") {
    // DELETE sans corps — évite Content-Type: application/json vide
  }

  const upstream = await fetch(url, init);
  const text = await upstream.text();

  const res = new NextResponse(text || null, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });

  if (upstream.status === 401) {
    res.cookies.set(COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
