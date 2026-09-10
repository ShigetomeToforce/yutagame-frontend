import { Handlers } from "$fresh/server.ts";
import {
  cleanupOldServerLogs,
  readServerLogs,
} from "../../../utils/serverLog.ts";

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export const handler: Handlers = {
  async GET(req) {
    try {
      await cleanupOldServerLogs();
      const url = new URL(req.url);
      const result = await readServerLogs({
        scope: url.searchParams.get("scope") || "app",
        kind: url.searchParams.get("kind") || "access",
        date: url.searchParams.get("date") || "",
        level: url.searchParams.get("level") || "",
        q: url.searchParams.get("q") || "",
        page: parseNumber(url.searchParams.get("page"), 1),
        limit: parseNumber(url.searchParams.get("limit"), 30),
      });

      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "ログの読み込みに失敗しました。";
      return Response.json({ message }, { status: 500 });
    }
  },
};
