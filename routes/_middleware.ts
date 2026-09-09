import { FreshContext } from "$fresh/server.ts";
import { getMaintenanceStatus } from "../utils/maintenance.ts";
import { getCookieValue, postPublicEvent } from "../utils/publicEvent.ts";

const BYPASS_PREFIXES = [
  "/admin",
  "/_fresh",
  "/images",
  "/api",
];

const BYPASS_EXACT_PATHS = new Set([
  "/maintenance",
  "/app/out",
  "/favicon.ico",
  "/favicon.png",
  "/logo.png",
  "/styles.css",
  "/robots.txt",
]);

const VISITOR_COOKIE_NAME = "visitor_id";

function buildVisitorId(): string {
  return crypto.randomUUID();
}

function ensureVisitorId(
  req: Request,
): { visitorId: string; shouldSetCookie: boolean } {
  const cookieHeader = req.headers.get("cookie") || "";
  const existing = getCookieValue(cookieHeader, VISITOR_COOKIE_NAME);
  if (existing) {
    return { visitorId: existing, shouldSetCookie: false };
  }
  return { visitorId: buildVisitorId(), shouldSetCookie: true };
}

function shouldBypass(pathname: string): boolean {
  if (BYPASS_EXACT_PATHS.has(pathname)) return true;
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);
  const { visitorId, shouldSetCookie } = ensureVisitorId(req);

  if (shouldBypass(url.pathname)) {
    const res = await ctx.next();
    if (shouldSetCookie) {
      res.headers.append(
        "set-cookie",
        `${VISITOR_COOKIE_NAME}=${
          encodeURIComponent(visitorId)
        }; Path=/; Max-Age=31536000; SameSite=Lax`,
      );
    }
    return res;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const res = await ctx.next();
    if (shouldSetCookie) {
      res.headers.append(
        "set-cookie",
        `${VISITOR_COOKIE_NAME}=${
          encodeURIComponent(visitorId)
        }; Path=/; Max-Age=31536000; SameSite=Lax`,
      );
    }
    return res;
  }

  try {
    const status = await getMaintenanceStatus();
    if (status.enabled) {
      void postPublicEvent({
        eventType: "page_view",
        eventSource: "frontend_ssr",
        path: `${url.pathname}${url.search}`,
        method: req.method,
        statusCode: 307,
        visitorId,
        referrer: req.headers.get("referer") || "",
      });

      const location = `/maintenance?from=${
        encodeURIComponent(url.pathname + url.search)
      }`;
      const res = new Response("", {
        status: 307,
        headers: { Location: location },
      });
      if (shouldSetCookie) {
        res.headers.append(
          "set-cookie",
          `${VISITOR_COOKIE_NAME}=${
            encodeURIComponent(visitorId)
          }; Path=/; Max-Age=31536000; SameSite=Lax`,
        );
      }
      return res;
    }
  } catch (error) {
    console.error("maintenance check failed", error);
  }

  const res = await ctx.next();

  void postPublicEvent({
    eventType: "page_view",
    eventSource: "frontend_ssr",
    path: `${url.pathname}${url.search}`,
    method: req.method,
    statusCode: res.status,
    visitorId,
    referrer: req.headers.get("referer") || "",
  });

  if (shouldSetCookie) {
    res.headers.append(
      "set-cookie",
      `${VISITOR_COOKIE_NAME}=${
        encodeURIComponent(visitorId)
      }; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }

  return res;
}
