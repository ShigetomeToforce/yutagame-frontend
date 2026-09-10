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
  contactCount: number;
  genreSearches: number;
  machineSearches: number;
  makerSearches: number;
  keywordSearches: number;
  affiliateClicks: number;
  announcementViews: number;
  featureViews: number;
  bannerViews: number;
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

export interface AccessMonthlyRow {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  searchCount: number;
  machineSearches: number;
  makerSearches: number;
  genreSearches: number;
  keywordSearches: number;
  contactCount: number;
  announcementViews: number;
  featureViews: number;
  bannerViews: number;
}

export interface AccessMonthlyTable {
  month: string;
  prevMonth: string;
  nextMonth: string;
  rows: AccessMonthlyRow[];
  monthlySum: AccessMonthlyRow;
}

export async function fetchAccessMonthlyTable(
  month?: string,
): Promise<AccessMonthlyTable> {
  const query = new URLSearchParams();
  if (month) {
    query.set("month", month);
  }
  const suffix = query.toString();
  return await adminFetch<AccessMonthlyTable>(
    `/admin/access-logs/monthly-table${suffix ? `?${suffix}` : ""}`,
  );
}

export type SearchBreakdownField =
  | "machineCode"
  | "manufacturerCode"
  | "genreCode"
  | "keywordCode"
  | "searchWord";

export interface AccessSearchBreakdown {
  field: SearchBreakdownField;
  date: string;
  daily: TopItem[];
  total: TopItem[];
}

export type MachineSearchPeriod = "daily" | "monthly" | "total";

export interface MachineSearchDashboard {
  period: MachineSearchPeriod;
  target: string;
  items: TopItem[];
}

export async function fetchMachineSearchDashboard(input: {
  period: MachineSearchPeriod;
  date?: string;
  month?: string;
  limit?: number;
}): Promise<MachineSearchDashboard> {
  const query = new URLSearchParams({ period: input.period });
  if (input.date) {
    query.set("date", input.date);
  }
  if (input.month) {
    query.set("month", input.month);
  }
  if (input.limit && input.limit > 0) {
    query.set("limit", String(input.limit));
  }

  return await adminFetch<MachineSearchDashboard>(
    `/admin/access-logs/machine-searches?${query.toString()}`,
  );
}

export type RankingField =
  | "machineCode"
  | "manufacturerCode"
  | "genreCode"
  | "keywordCode"
  | "searchWord";

export interface RankingDashboard {
  period: MachineSearchPeriod;
  target: string;
  items: TopItem[];
}

export async function fetchSearchRankingDashboard(input: {
  field: RankingField;
  period: MachineSearchPeriod;
  date?: string;
  month?: string;
  limit?: number;
}): Promise<RankingDashboard> {
  const query = new URLSearchParams({
    field: input.field,
    period: input.period,
  });

  if (input.date) {
    query.set("date", input.date);
  }
  if (input.month) {
    query.set("month", input.month);
  }
  if (input.limit && input.limit > 0) {
    query.set("limit", String(input.limit));
  }

  return await adminFetch<RankingDashboard>(
    `/admin/access-logs/search-rankings?${query.toString()}`,
  );
}

export async function fetchGameViewDashboard(input: {
  period: MachineSearchPeriod;
  date?: string;
  month?: string;
  limit?: number;
}): Promise<RankingDashboard> {
  const query = new URLSearchParams({ period: input.period });
  if (input.date) {
    query.set("date", input.date);
  }
  if (input.month) {
    query.set("month", input.month);
  }
  if (input.limit && input.limit > 0) {
    query.set("limit", String(input.limit));
  }

  return await adminFetch<RankingDashboard>(
    `/admin/access-logs/game-views?${query.toString()}`,
  );
}

export async function fetchAccessSearchBreakdown(input: {
  field: SearchBreakdownField;
  date?: string;
  limit?: number;
}): Promise<AccessSearchBreakdown> {
  const query = new URLSearchParams({ field: input.field });
  if (input.date) {
    query.set("date", input.date);
  }
  if (input.limit && input.limit > 0) {
    query.set("limit", String(input.limit));
  }

  return await adminFetch<AccessSearchBreakdown>(
    `/admin/access-logs/search-breakdown?${query.toString()}`,
  );
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
