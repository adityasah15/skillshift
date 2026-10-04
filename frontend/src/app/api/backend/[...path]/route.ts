import type { NextRequest } from "next/server";

/**
 * Same-origin proxy: `/api/backend/*` → backend.
 * Why a route handler (not a rewrite): the refresh cookie is
 * `HttpOnly, Path=/auth`, so the browser would never send it to
 * `/api/backend/auth/refresh`. We rewrite `Path=/auth` → `Path=/` on the
 * way out so the browser returns it to the proxy, then forward the
 * `Cookie` header server-side where path scoping does not apply.
 */
export const dynamic = "force-dynamic";

const BACKEND =
  process.env.SKILLSHIFT_API_URL ?? "http://localhost:3000";

const HOP_BY_HOP = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

function rewriteCookiePath(value: string): string {
  return value.replace(/;\s*Path=\/auth(?=;|$)/gi, "; Path=/");
}

async function proxy(
  req: NextRequest,
  ctx: RouteContext<"/api/backend/[...path]">,
) {
  const { path } = await ctx.params;
  const target = `${BACKEND}/${(path ?? []).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.append(key, value);
  });

  // getSetCookie() is available in the Node runtime; fall back otherwise.
  const rawCookies: string[] =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : (() => {
          const single = upstream.headers.get("set-cookie");
          return single ? [single] : [];
        })();
  if (rawCookies.length > 0) {
    out.delete("set-cookie");
    for (const c of rawCookies) out.append("set-cookie", rewriteCookiePath(c));
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: out,
  });
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  return proxy(req, ctx);
}
