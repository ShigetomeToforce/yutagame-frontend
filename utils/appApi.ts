import { APP_BASE_URL } from "./api.ts";
import { getCookieValue } from "./publicEvent.ts";

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
  rank?: number;
  previousRank?: number;
  rankingCount?: number;
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

export interface RankingQuery {
  type?: "curated" | "views" | "favorites";
  period?: "monthly" | "yearly" | "total";
  page?: number;
  limit?: number;
}

export interface TopContents {
  releaseToday: GameItem[];
  recentlyReleased: GameItem[];
  recentlyUpdated: GameItem[];
  randomPicks: GameItem[];
  rankingTop20: GameItem[];
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
  publishStartAt?: string;
  publishEndAt?: string;
  displayOrder?: number;
  accessCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureItem {
  id: number;
  code: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  thumbnailImageKey?: string;
  status: string;
  publishedAt?: string;
  publishStartAt?: string;
  publishEndAt?: string;
  displayOrder?: number;
  accessCount?: number;
  games?: GameItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BannerItem {
  id: number;
  title: string;
  placement: string;
  imageKey: string;
  linkUrl: string;
  openInNewTab: boolean;
  startsAt?: string;
  endsAt?: string;
  displayOrder: number;
  clickCount: number;
  accessCount?: number;
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

export interface GameRecommendationItem {
  id: number;
  gameName: string;
  reason: string;
  status: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface SitemapData {
  gameCodes: string[];
  announcementIds: number[];
  featureCodes: string[];
}

export interface SiteStats {
  gameCount: number;
  totalListPrice: number;
}

export interface SearchQuery {
  q?: string;
  machineCode?: string;
  genreCode?: string;
  manufacturerCode?: string;
  keywordCode?: string;
  sort?: string;
  page?: number;
  limit?: number;
  visitorId?: string;
}

function getVisitorIdFromCookie(): string {
  if (isServer || typeof document === "undefined") return "";
  return getCookieValue(document.cookie, "visitor_id");
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

export async function appFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // ブラウザは公開設定の1URL、SSRはDocker内外の候補を順番に試します。
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
      const response = await fetch(url, options);
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

      if (response.status === 204) return undefined as T;
      return await response.json() as T;
    } catch (error) {
      // HTTPエラーは正しいサーバーからの応答なので再試行せず、通信不能時だけ次候補へ進みます。
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

export async function recordPageView(
  visitorId: string,
  pagePath: string,
): Promise<void> {
  await appFetch<void>("/app/page-views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, pagePath }),
  });
}

export async function fetchPublicBanners(
  placement: string,
  visitorId?: string,
): Promise<BannerItem[]> {
  const query = new URLSearchParams();
  if (visitorId) query.set("visitorId", visitorId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return await appFetch<BannerItem[]>(
    `/app/banners/${encodeURIComponent(placement)}${suffix}`,
  );
}

export async function fetchSiteStats(): Promise<SiteStats> {
  return await appFetch<SiteStats>("/app/site-stats");
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
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.visitorId) query.set("visitorId", params.visitorId);

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function searchGames(
  params: SearchQuery,
): Promise<SearchResponse> {
  const visitorId = params.visitorId || getVisitorIdFromCookie();
  return await appFetch<SearchResponse>(
    `/app/games${buildQueryString({ ...params, visitorId })}`,
  );
}

export async function fetchPublicRanking(
  params: RankingQuery,
): Promise<SearchResponse> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.period) query.set("period", params.period);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  return await appFetch<SearchResponse>(
    `/app/rankings/page?${query.toString()}`,
  );
}

export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  return await appFetch<AnnouncementItem[]>("/app/announcements");
}

export async function fetchFeatures(): Promise<FeatureItem[]> {
  return await appFetch<FeatureItem[]>("/app/features");
}

export async function fetchFeatureByCode(
  code: string,
  visitorId?: string,
): Promise<FeatureItem> {
  const query = new URLSearchParams();
  if (visitorId) query.set("visitorId", visitorId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return await appFetch<FeatureItem>(
    `/app/features/${encodeURIComponent(code)}${suffix}`,
  );
}

export async function fetchAnnouncementById(
  id: number,
  visitorId?: string,
): Promise<AnnouncementItem> {
  const query = new URLSearchParams();
  if (visitorId) query.set("visitorId", visitorId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return await appFetch<AnnouncementItem>(`/app/announcements/${id}${suffix}`);
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

export async function submitGameRecommendation(
  payload: { gameName: string; reason: string },
): Promise<GameRecommendationItem> {
  const response = await fetch(`${APP_BASE_URL}/app/game-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "おすすめゲームの送信に失敗しました。");
  }
  return await response.json() as GameRecommendationItem;
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
