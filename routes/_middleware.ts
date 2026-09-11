import { FreshContext } from "$fresh/server.ts";
import { getMaintenanceStatus } from "../utils/maintenance.ts";
import { getCookieValue } from "../utils/publicEvent.ts";
import { logServerEvent } from "../utils/serverLog.ts";
import { recordPageView } from "../utils/appApi.ts";
import {
  resolveLogKind,
  resolveLogLevel,
  resolveLogScope,
  shouldBypassPublicPage,
  shouldRecordPageView,
  shouldWriteRequestLog,
} from "../utils/requestPolicy.ts";

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

function appendVisitorCookie(
  response: Response,
  visitorId: string,
  shouldSetCookie: boolean,
): Response {
  if (shouldSetCookie) {
    // 1年間同じ匿名IDを使うことで、ログイン不要でも日次UUの重複を判定できます。
    response.headers.append(
      "set-cookie",
      `${VISITOR_COOKIE_NAME}=${
        encodeURIComponent(visitorId)
      }; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }
  return response;
}

function writeRequestLogs(
  req: Request,
  pathnameWithQuery: string,
  status: number,
) {
  const pathname = new URL(req.url).pathname;
  if (!shouldWriteRequestLog(pathname)) {
    return;
  }

  const scope = resolveLogScope(pathname);
  const kind = resolveLogKind(pathname);
  const level = resolveLogLevel(status);
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
  const scope = resolveLogScope(new URL(req.url).pathname);
  void logServerEvent(scope, "error", "error", "request failed", {
    method: req.method,
    path: pathnameWithQuery,
    statusCode: 500,
    error: error instanceof Error ? error.message : String(error),
  });
}

async function writePageView(
  req: Request,
  pathname: string,
  visitorId: string,
  status: number,
) {
  // ブラウザの事前確認HEADやエラーページをPVに含めないよう、正常なGETだけを記録します。
  if (!shouldRecordPageView(req.method, status)) return;
  try {
    await recordPageView(visitorId, pathname);
  } catch (error) {
    // 集計基盤の停止で公開ページ自体を閲覧不能にしない設計です。
    writeRequestError(req, pathname, error);
  }
}

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);
  const pathnameWithQuery = `${url.pathname}${url.search}`;
  const { visitorId, shouldSetCookie } = ensureVisitorId(req);

  // 管理画面・API・静的ファイルは通常処理へ渡し、公開ページの保守判定とPV記録を行いません。
  if (shouldBypassPublicPage(url.pathname)) {
    const res = await ctx.next();
    writeRequestLogs(req, pathnameWithQuery, res.status);
    return appendVisitorCookie(res, visitorId, shouldSetCookie);
  }

  // 更新系リクエストではページ表示が発生しないため、保守判定とPV記録を省略します。
  if (req.method !== "GET" && req.method !== "HEAD") {
    const res = await ctx.next();
    writeRequestLogs(req, pathnameWithQuery, res.status);
    return appendVisitorCookie(res, visitorId, shouldSetCookie);
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
      return appendVisitorCookie(res, visitorId, shouldSetCookie);
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
  await writePageView(req, url.pathname, visitorId, res.status);

  return appendVisitorCookie(res, visitorId, shouldSetCookie);
}
