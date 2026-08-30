import { APP_BASE_URL } from "./api.ts";

const isServer = typeof Deno !== "undefined";

export interface CatalogItem {
  code: string;
  name: string;
  imageKey?: string;
  gameCount: number;
}

export interface KeywordItem {
  code: string;
  name: string;
  gameCount: number;
}

export interface LinkedMaster {
  id: number;
  name: string;
  code: string;
}

export interface GameKeyword {
  id: number;
  name: string;
  code: string;
}

export interface GameItem {
  id: number;
  name: string;
  kana: string;
  code: string;
  imageKey?: string;
  overview: string;
  catchCopy: string;
  subCatch: string;
  listPrice: number;
  releaseDate: string;
  officialSiteUrl: string;
  youTubeUrl: string;
  manufacturer?: LinkedMaster;
  machine?: LinkedMaster;
  genre?: LinkedMaster;
  keywords: GameKeyword[];
}

export interface SearchResponse {
  data: GameItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface TopContents {
  releaseToday: GameItem[];
  recentlyUpdated: GameItem[];
  randomPicks: GameItem[];
}

export interface SearchQuery {
  q?: string;
  machineCode?: string;
  genreCode?: string;
  manufacturerCode?: string;
  keywordCode?: string;
  page?: number;
  limit?: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function buildServerBaseCandidates(): string[] {
  const candidates: string[] = [];
  const add = (value: string | undefined | null) => {
    if (!value) return;
    const normalized = normalizeBaseUrl(value);
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  add(APP_BASE_URL);

  if (!isServer) return candidates;

  add(Deno.env.get("APP_BASE_URL"));
  add(Deno.env.get("ADMIN_BASE_URL"));

  // frontend コンテナ上で localhost を向くと自分自身を見に行くため、Docker向け候補を自動追加
  add("http://host.docker.internal:8080/api");
  add("http://backend:8080/api");
  add("http://yutagame-backend:8080/api");

  return candidates;
}

export async function appFetch<T>(endpoint: string): Promise<T> {
  const formattedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const baseCandidates = isServer
    ? buildServerBaseCandidates()
    : [normalizeBaseUrl(APP_BASE_URL)];

  let lastNetworkError: unknown = null;

  for (const baseUrl of baseCandidates) {
    const url = `${baseUrl}${formattedEndpoint}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let message = "データの取得に失敗しました。";
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore json parse error and use fallback message.
        }
        throw new Error(message);
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error && error.name !== "TypeError") {
        throw error;
      }
      lastNetworkError = error;
    }
  }

  const candidatesText = baseCandidates.join(", ");
  const reason = lastNetworkError instanceof Error
    ? lastNetworkError.message
    : "network error";

  throw new Error(
    `バックエンドAPIへ接続できませんでした。候補: ${candidatesText}. 理由: ${reason}`,
  );
}

function buildQueryString(params: SearchQuery): string {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.machineCode) query.set("machineCode", params.machineCode);
  if (params.genreCode) query.set("genreCode", params.genreCode);
  if (params.manufacturerCode) {
    query.set("manufacturerCode", params.manufacturerCode);
  }
  if (params.keywordCode) query.set("keywordCode", params.keywordCode);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function searchGames(
  params: SearchQuery,
): Promise<SearchResponse> {
  return await appFetch<SearchResponse>(
    `/app/games${buildQueryString(params)}`,
  );
}
