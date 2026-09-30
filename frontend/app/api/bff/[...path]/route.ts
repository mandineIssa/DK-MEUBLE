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

  if (!token && path === "customer/notifications/unread-count") {
    return NextResponse.json({ unread_count: 0 });
  }

  if (!token && path === "customer/logout") {
    return new NextResponse(null, { status: 204 });
  }

  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const cartToken = req.headers.get("x-cart-token");
  if (cartToken) headers.set("X-Cart-Token", cartToken);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const body = await req.arrayBuffer();
    if (body.byteLength) init.body = body;
  }

  const upstream = await fetch(url, init);
  const bytes = new Uint8Array(await upstream.arrayBuffer());

  const expiredSession =
    upstream.status === 401 &&
    (path === "customer/logout" || path === "customer/notifications/unread-count");

  const res = expiredSession
    ? path === "customer/logout"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ unread_count: 0 })
    : new NextResponse(bytes.byteLength ? bytes : null, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "application/json",
          ...(upstream.headers.get("X-Cart-Token")
            ? { "X-Cart-Token": upstream.headers.get("X-Cart-Token") as string }
            : {}),
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
