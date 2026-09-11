const BYPASS_PREFIXES = ["/admin", "/_fresh", "/images", "/api"];

const BYPASS_EXACT_PATHS = new Set([
  "/maintenance",
  "/app/out",
  "/favicon.ico",
  "/favicon.png",
  "/logo.png",
  "/styles.css",
  "/robots.txt",
]);

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasFileExtension(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

// 保守画面・管理画面・API・静的ファイルは、公開ページの保守判定とPV記録から外します。
export function shouldBypassPublicPage(pathname: string): boolean {
  return BYPASS_EXACT_PATHS.has(pathname) ||
    BYPASS_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix)) ||
    hasFileExtension(pathname);
}

// ファイルログには管理/APIアクセスも残し、フレームワーク内部と静的ファイルだけを除きます。
export function shouldWriteRequestLog(pathname: string): boolean {
  return !matchesPathPrefix(pathname, "/_fresh") &&
    !matchesPathPrefix(pathname, "/images") &&
    !BYPASS_EXACT_PATHS.has(pathname) &&
    !hasFileExtension(pathname);
}

export function resolveLogScope(pathname: string): "app" | "admin" {
  return matchesPathPrefix(pathname, "/admin") ? "admin" : "app";
}

export function resolveLogKind(pathname: string): "access" | "api" {
  return matchesPathPrefix(pathname, "/api") ||
      matchesPathPrefix(pathname, "/admin/api")
    ? "api"
    : "access";
}

export function resolveLogLevel(status: number): "info" | "warn" | "error" {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

export function shouldRecordPageView(method: string, status: number): boolean {
  return method === "GET" && status >= 200 && status < 300;
}
