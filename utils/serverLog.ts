export type LogScope = "app" | "admin";
export type LogKind = "access" | "api" | "error";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: string;
  scope: LogScope;
  kind: LogKind;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  source: "frontend";
  fields?: Record<string, unknown>;
}

export interface ReadLogOptions {
  scope?: string;
  kind?: string;
  date?: string;
  level?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ReadLogResult {
  data: LogEntry[];
  totalCount: number;
  totalPages: number;
  fileName: string;
}

function canUseFileSystem(): boolean {
  return typeof Deno !== "undefined";
}

function normalizeScope(value?: string): LogScope {
  return value === "admin" ? "admin" : "app";
}

function normalizeKind(value?: string): LogKind {
  if (value === "api") return "api";
  if (value === "error") return "error";
  return "access";
}

function normalizeLevel(value?: string): LogLevel {
  if (value === "debug") return "debug";
  if (value === "warn") return "warn";
  if (value === "error") return "error";
  return "info";
}

function normalizeDate(value?: string): string {
  const raw = (value || "").trim();
  if (!raw) return new Date().toISOString().slice(0, 10).replaceAll("-", "");

  const plain = raw.replaceAll("-", "");
  if (/^\d{8}$/.test(plain)) return plain;
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function logBaseDir(): string {
  const fromEnv = canUseFileSystem()
    ? (Deno.env.get("FRONTEND_LOG_DIR") || "")
    : "";
  return fromEnv.trim() || "./logs";
}

function logFilePath(scope: LogScope, kind: LogKind, date: string): string {
  return `${logBaseDir()}/${scope}/${kind}_log_${date}.log`;
}

function toStatusCode(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function containsQuery(entry: LogEntry, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if ((entry.message || "").toLowerCase().includes(needle)) return true;
  if ((entry.path || "").toLowerCase().includes(needle)) return true;
  if ((entry.method || "").toLowerCase().includes(needle)) return true;
  if (!entry.fields) return false;
  return Object.entries(entry.fields).some(([key, value]) => {
    return key.toLowerCase().includes(needle) ||
      String(value).toLowerCase().includes(needle);
  });
}

export async function logServerEvent(
  scope: string,
  kind: string,
  level: string,
  message: string,
  fields?: Record<string, unknown>,
): Promise<void> {
  if (!canUseFileSystem()) return;

  const normalizedScope = normalizeScope(scope);
  const normalizedKind = normalizeKind(kind);
  const normalizedLevel = normalizeLevel(level);
  const date = normalizeDate();
  const path = logFilePath(normalizedScope, normalizedKind, date);

  const entry: LogEntry = {
    id: String(Date.now()) + String(Math.floor(Math.random() * 1000000)),
    timestamp: new Date().toISOString(),
    scope: normalizedScope,
    kind: normalizedKind,
    level: normalizedLevel,
    message: message.trim() || "log",
    source: "frontend",
    method: typeof fields?.method === "string" ? fields.method : undefined,
    path: typeof fields?.path === "string" ? fields.path : undefined,
    statusCode: toStatusCode(fields?.statusCode),
    fields,
  };

  await Deno.mkdir(`${logBaseDir()}/${normalizedScope}`, { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(entry)}\n`, {
    append: true,
    create: true,
  });
}

export async function readServerLogs(
  options: ReadLogOptions,
): Promise<ReadLogResult> {
  if (!canUseFileSystem()) {
    return { data: [], totalCount: 0, totalPages: 0, fileName: "" };
  }

  const scope = normalizeScope(options.scope);
  const kind = normalizeKind(options.kind);
  const date = normalizeDate(options.date);
  const level = (options.level || "").trim().toLowerCase();
  const q = (options.q || "").trim();
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 30;

  const filePath = logFilePath(scope, kind, date);
  const fileName = `${kind}_log_${date}.log`;

  let text = "";
  try {
    text = await Deno.readTextFile(filePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return { data: [], totalCount: 0, totalPages: 0, fileName };
    }
    throw error;
  }

  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      try {
        const parsed = JSON.parse(line) as LogEntry;
        return {
          ...parsed,
          scope: normalizeScope(parsed.scope),
          kind: normalizeKind(parsed.kind),
          level: normalizeLevel(parsed.level),
          source: "frontend" as const,
          id: parsed.id || `${date}-${index + 1}`,
        };
      } catch {
        return {
          id: `${date}-broken-${index + 1}`,
          timestamp: "",
          scope,
          kind,
          level: "error" as const,
          message: line,
          source: "frontend" as const,
        };
      }
    })
    .filter((entry) => !level || entry.level === level)
    .filter((entry) => containsQuery(entry, q))
    .reverse();

  const totalCount = rows.length;
  if (totalCount === 0) {
    return { data: [], totalCount: 0, totalPages: 0, fileName };
  }

  const totalPages = Math.ceil(totalCount / limit);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const end = start + limit;

  return {
    data: rows.slice(start, end),
    totalCount,
    totalPages,
    fileName,
  };
}
