import { adminFetch } from "./api.ts";

export type LogSource = "backend" | "frontend";
export type LogScope = "app" | "admin";
export type LogKind = "access" | "api" | "error";
export type LogLevel = "" | "debug" | "info" | "warn" | "error";

export interface AccessLogItem {
  id: string;
  timestamp: string;
  scope: LogScope;
  kind: LogKind;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  source: LogSource;
  fields?: Record<string, unknown>;
}

export interface PaginatedAccessLogResponse {
  data: AccessLogItem[];
  totalCount: number;
  totalPages: number;
  fileName?: string;
}

export interface TopItem {
  value: string;
  count: number;
}

export interface KpiBucket {
  from: string;
  to: string;
  pageViews: number;
  uniqueVisitors: number;
  apiCalls: number;
  searchCount: number;
  affiliateClicks: number;
  errorCount: number;
  topMachines: TopItem[];
  topManufacturers: TopItem[];
  topGenres: TopItem[];
  topKeywords: TopItem[];
  topSearchWords: TopItem[];
}

export interface AccessDashboard {
  daily: KpiBucket;
  monthly: KpiBucket;
}

export async function fetchAccessDashboard(): Promise<AccessDashboard> {
  return await adminFetch<AccessDashboard>("/admin/access-logs/dashboard");
}

export interface FetchFileLogParams {
  page: number;
  limit: number;
  query: string;
  source: LogSource;
  scope: LogScope;
  kind: LogKind;
  level: LogLevel;
  date: string;
}

export async function fetchAccessLogs(
  input: FetchFileLogParams,
): Promise<PaginatedAccessLogResponse> {
  const queryParams = new URLSearchParams({
    page: String(input.page),
    limit: String(input.limit),
    q: input.query,
    scope: input.scope,
    kind: input.kind,
    date: input.date,
  });

  if (input.kind === "error" && input.level) {
    queryParams.set("level", input.level);
  }

  if (input.source === "backend") {
    return await adminFetch<PaginatedAccessLogResponse>(
      `/admin/log-files?${queryParams.toString()}`,
    );
  }

  const response = await fetch(
    `/admin/api/log-files?${queryParams.toString()}`,
    {
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "フロントログの取得に失敗しました。");
  }

  return await response.json() as PaginatedAccessLogResponse;
}
