import { adminFetch } from "./api.ts";

export interface AccessLogItem {
  id: number;
  eventType: string;
  eventSource: string;
  path: string;
  method: string;
  statusCode: number;
  visitorId: string;
  machineCode: string;
  manufacturerCode: string;
  genreCode: string;
  keywordCode: string;
  searchWord: string;
  gameCode: string;
  affiliateCategory: string;
  createdAt: string;
}

export interface PaginatedAccessLogResponse {
  data: AccessLogItem[];
  totalCount: number;
  totalPages: number;
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

export async function fetchAccessLogs(
  page: number,
  limit: number,
  query: string,
  eventType: string,
  fromDate: string,
  toDate: string,
): Promise<PaginatedAccessLogResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    q: query,
    eventType,
    fromDate,
    toDate,
  });
  return await adminFetch<PaginatedAccessLogResponse>(
    `/admin/access-logs?${params.toString()}`,
  );
}
