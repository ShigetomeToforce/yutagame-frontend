import { FreshContext } from "$fresh/server.ts";
import { getMaintenanceStatus } from "../utils/maintenance.ts";
import { getCookieValue } from "../utils/publicEvent.ts";
import { logServerEvent } from "../utils/serverLog.ts";

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

function resolveScope(pathname: string): "app" | "admin" {
  return pathname.startsWith("/admin") ? "admin" : "app";
}

function resolveKind(pathname: string): "access" | "api" {
  return pathname.startsWith("/api") || pathname.startsWith("/admin/api")
    ? "api"
    : "access";
}

function resolveLevel(status: number): "info" | "warn" | "error" {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

function shouldWriteFileLog(pathname: string): boolean {
  if (pathname.startsWith("/_fresh") || pathname.startsWith("/images")) {
    return false;
  }
  if (BYPASS_EXACT_PATHS.has(pathname)) {
    return false;
  }
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return false;
  }
  return true;
}

function writeRequestLogs(
  req: Request,
  pathnameWithQuery: string,
  status: number,
) {
  const pathname = new URL(req.url).pathname;
  if (!shouldWriteFileLog(pathname)) {
    return;
  }

  const scope = resolveScope(pathname);
  const kind = resolveKind(pathname);
  const level = resolveLevel(status);
  const fields = {
    method: req.method,
    path: pathnameWithQuery,
    statusCode: status,
    referrer: req.headers.get("referer") || "",
    userAgent: req.headers.get("user-agent") || "",
  };

  void logServerEvent(scope, kind, level, "request completed", fields);
  void logServerEvent(scope, "error", level, "request completed", fields);
}

function writeRequestError(
  req: Request,
  pathnameWithQuery: string,
  error: unknown,
) {
  const scope = resolveScope(new URL(req.url).pathname);
  void logServerEvent(scope, "error", "error", "request failed", {
    method: req.method,
    path: pathnameWithQuery,
    statusCode: 500,
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);
  const pathnameWithQuery = `${url.pathname}${url.search}`;
  const { visitorId, shouldSetCookie } = ensureVisitorId(req);

  if (shouldBypass(url.pathname)) {
    const res = await ctx.next();
    writeRequestLogs(req, pathnameWithQuery, res.status);
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
    writeRequestLogs(req, pathnameWithQuery, res.status);
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
      writeRequestLogs(req, pathnameWithQuery, 307);

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
    writeRequestError(req, pathnameWithQuery, error);
  }

  let res: Response;
  try {
    res = await ctx.next();
  } catch (error) {
    writeRequestError(req, pathnameWithQuery, error);
    throw error;
  }

  writeRequestLogs(req, pathnameWithQuery, res.status);

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
