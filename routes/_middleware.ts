import { FreshContext } from "$fresh/server.ts";
import { getMaintenanceStatus } from "../utils/maintenance.ts";

const BYPASS_PREFIXES = [
  "/admin",
  "/_fresh",
  "/images",
  "/api",
];

const BYPASS_EXACT_PATHS = new Set([
  "/maintenance",
  "/favicon.ico",
  "/favicon.png",
  "/logo.png",
  "/styles.css",
  "/robots.txt",
]);

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

  if (shouldBypass(url.pathname)) {
    return await ctx.next();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return await ctx.next();
  }

  try {
    const status = await getMaintenanceStatus();
    if (status.enabled) {
      const location = `/maintenance?from=${
        encodeURIComponent(url.pathname + url.search)
      }`;
      return new Response("", {
        status: 307,
        headers: { Location: location },
      });
    }
  } catch (error) {
    console.error("maintenance check failed", error);
  }

  return await ctx.next();
}
