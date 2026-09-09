import { APP_BASE_URL } from "./api.ts";

const isServer = typeof Deno !== "undefined";

export class AppHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppHttpError";
    this.status = status;
  }
}

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

export interface GameAffiliate {
  id: number;
  gameId: number;
  category: string;
  url: string;
}

export interface GameFavoriteStatus {
  gameId: number;
  count: number;
  alreadyVoted: boolean;
  favoriteDate: string;
}

export interface GameItem {
  id: number;
  name: string;
  kana: string;
  code: string;
  imageKey?: string;
  overview: string;
  subGenre: string;
  catchCopy: string;
  subCatch: string;
  listPrice: number;
  releaseDate: string;
  officialSiteUrl: string;
  youtubeUrl: string;
  manufacturer?: LinkedMaster;
  machine?: LinkedMaster;
  genre?: LinkedMaster;
  keywords: GameKeyword[];
  affiliates?: GameAffiliate[];
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
  recentlyReleased: GameItem[];
  recentlyUpdated: GameItem[];
  randomPicks: GameItem[];
  favoriteRanking: FavoriteRankingItem[];
}

export interface FavoriteRankingItem {
  game: GameItem;
  count: number;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  excerpt: string;
  bodyHtml: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInquiryItem {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface SitemapData {
  gameCodes: string[];
  announcementIds: number[];
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
        throw new AppHttpError(response.status, message);
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

  throw new AppHttpError(
    503,
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

export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  return await appFetch<AnnouncementItem[]>("/app/announcements");
}

export async function fetchAnnouncementById(
  id: number,
): Promise<AnnouncementItem> {
  return await appFetch<AnnouncementItem>(`/app/announcements/${id}`);
}

export async function submitContactInquiry(
  payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  },
): Promise<ContactInquiryItem> {
  const response = await fetch(`${APP_BASE_URL}/app/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "問い合わせの送信に失敗しました。");
  }

  return await response.json() as ContactInquiryItem;
}

export async function fetchSitemapData(): Promise<SitemapData> {
  return await appFetch<SitemapData>("/app/sitemap");
}

function buildAppUrl(endpoint: string): string {
  const formattedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${APP_BASE_URL}${formattedEndpoint}`;
}

export async function fetchGameFavoriteStatus(
  code: string,
  visitorId?: string,
): Promise<GameFavoriteStatus> {
  const url = new URL(`http://local.invalid/app/games/${code}/favorite`);
  if (visitorId) {
    url.searchParams.set("visitorId", visitorId);
  }
  return await appFetch<GameFavoriteStatus>(`${url.pathname}${url.search}`);
}

export async function pushGameFavorite(
  code: string,
  visitorId: string,
): Promise<GameFavoriteStatus> {
  const response = await fetch(buildAppUrl(`/app/games/${code}/favorite`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ visitorId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "推しの送信に失敗しました。");
  }

  return await response.json() as GameFavoriteStatus;
}
