import { type Handlers, type PageProps } from "$fresh/server.ts";
import { buildImageUrl } from "../utils/image.ts";
import GameFavoriteButton from "../islands/app/GameFavoriteButton.tsx";
import PublicBannerSlider from "../islands/app/PublicBannerSlider.tsx";
import PublicHeader from "./_public_header.tsx";
import BackendUnavailablePage from "./_backend_unavailable_page.tsx";
import {
  AnnouncementItem,
  appFetch,
  AppHttpError,
  BannerItem,
  CatalogItem,
  fetchAnnouncements,
  fetchPublicBanners,
  GameItem,
  KeywordItem,
  TopContents,
} from "../utils/appApi.ts";
import { getCookieValue } from "../utils/publicEvent.ts";
import {
  JsonLd,
  organizationJsonLd,
  SeoHead,
  websiteJsonLd,
} from "../utils/seo.tsx";

interface PageData {
  machines: CatalogItem[];
  genres: CatalogItem[];
  manufacturers: CatalogItem[];
  keywords: KeywordItem[];
  top: TopContents;
  announcements: AnnouncementItem[];
  topAboveBanners: BannerItem[];
  topBelowBanners: BannerItem[];
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const visitorId = getCookieValue(
      req.headers.get("cookie") || "",
      "visitor_id",
    );
    try {
      const [
        machines,
        genres,
        manufacturers,
        keywords,
        top,
        announcements,
        topAboveBanners,
        topBelowBanners,
      ] = await Promise.all([
        appFetch<CatalogItem[]>("/app/catalog/machines"),
        appFetch<CatalogItem[]>("/app/catalog/genres"),
        appFetch<CatalogItem[]>("/app/catalog/manufacturers"),
        appFetch<KeywordItem[]>("/app/keywords"),
        appFetch<TopContents>(
          "/app/top?releaseLimit=5&recentLimit=12&randomLimit=12",
        ),
        fetchAnnouncements(),
        fetchPublicBanners("top_above", visitorId),
        fetchPublicBanners("top_below", visitorId),
      ]);

      return ctx.render({
        machines,
        genres,
        manufacturers,
        keywords,
        top,
        announcements,
        topAboveBanners,
        topBelowBanners,
      });
    } catch (error) {
      if (
        error instanceof AppHttpError && error.status >= 500 &&
        error.status < 600
      ) {
        const requestUrl = new URL(req.url);
        return ctx.render(
          {
            machines: [],
            genres: [],
            manufacturers: [],
            keywords: [],
            top: {
              releaseToday: [],
              recentlyReleased: [],
              recentlyUpdated: [],
              randomPicks: [],
              rankingTop20: [],
              favoriteRanking: [],
            },
            announcements: [],
            topAboveBanners: [],
            topBelowBanners: [],
            backendUnavailable: true,
            retryHref: `${requestUrl.pathname}${requestUrl.search}`,
          },
          { status: 503 },
        );
      }
      throw error;
    }
  },
};

function uniqueGames(groups: GameItem[][]): GameItem[] {
  const map = new Map<string, GameItem>();
  for (const group of groups) {
    for (const game of group) {
      if (!map.has(game.code)) map.set(game.code, game);
    }
  }
  return Array.from(map.values());
}

function formatReleaseDate(dateValue?: string): string {
  if (!dateValue) return "-";
  const [year, month, day] = dateValue.slice(0, 10).split("-");
  if (!year || !month || !day) return "-";
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function isReleaseAnniversaryToday(dateValue?: string): boolean {
  if (!dateValue) return false;
  const releaseDate = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(releaseDate.getTime())) return false;

  const today = new Date();
  return releaseDate.getMonth() === today.getMonth() &&
    releaseDate.getDate() === today.getDate();
}

function formatPrice(value?: number): string {
  if (!value || value <= 0) return "-";
  return `${value.toLocaleString()}円`;
}

function formatGenre(game: GameItem): string {
  const genreName = game.genre?.name || "-";
  const sub = game.subGenre?.trim();
  if (!sub) return genreName;
  return `${genreName}（${sub}）`;
}

function toYouTubeEmbed(url?: string): string | null {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
  return null;
}

function formatAffiliateLabel(category: string): string {
  const map: Record<string, string> = {
    AMAZON: "Amazon",
    RAKUTEN: "楽天",
    YAHOO: "Yahoo!",
    SURUGAYA: "駿河屋",
    PLAYSTATION_STORE: "PlayStation Store",
    NINTENDO_STORE: "Nintendo Store",
    STEAM: "Steam",
  };
  return map[category] || category;
}

function buildOutboundHref(
  to: string,
  gameCode: string,
  category: string,
  source: string,
): string {
  const query = new URLSearchParams({
    to,
    gameCode,
    category,
    source,
  });
  return `/app/out?${query.toString()}`;
}

function buildSpotlightGames(top: TopContents): GameItem[] {
  return uniqueGames([top.releaseToday]);
}

function shuffleItems<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function SpotlightDetailCard(
  { game, compact = false }: {
    game: GameItem;
    compact?: boolean;
  },
) {
  const youtubeEmbed = toYouTubeEmbed(game.youtubeUrl);
  const catchCopy = game.catchCopy?.trim() || "";
  const subCatch = game.subCatch?.trim() || "";
  const isReleaseToday = isReleaseAnniversaryToday(game.releaseDate);
  const keywordItems = (game.keywords || [])
    .map((keyword) => keyword.name?.trim() || "")
    .filter((keyword) => keyword.length > 0);
  const purchaseLinks = (game.affiliates || [])
    .filter((item) => item.url?.trim())
    .map((item) => ({
      label: formatAffiliateLabel(item.category),
      url: item.url.trim(),
      category: item.category,
    }));
  const hasActionButtons = Boolean(game.officialSiteUrl) ||
    purchaseLinks.length > 0;
  const rowMinHeightClass = youtubeEmbed
    ? (compact ? "md:min-h-[480px]" : "md:min-h-[520px]")
    : (compact ? "md:min-h-[340px]" : "md:min-h-[360px]");
  const titleSizeClass = game.name.length > 28
    ? (compact ? "text-sm sm:text-base" : "text-base sm:text-xl")
    : (compact ? "text-base sm:text-xl" : "text-lg sm:text-2xl");

  return (
    <div class="soft-rise group w-full min-w-0">
      <a href={`/app/games/${game.code}`} class="mb-6 block min-w-0">
        <h3
          class={`game-card-floating-title break-words font-black leading-tight ${titleSizeClass}`}
        >
          {game.name}
        </h3>
      </a>

      <article class="spotlight-card relative overflow-hidden rounded-3xl">
        <div
          class={`grid gap-3 p-3 sm:p-4 md:grid-cols-3 md:items-stretch md:gap-4 ${rowMinHeightClass}`}
        >
          <div
            class={`relative overflow-hidden rounded-2xl md:col-span-1 md:h-full md:self-stretch ${
              compact ? "h-[180px]" : "h-[220px]"
            }`}
          >
            <a href={`/app/games/${game.code}`} class="block h-full w-full">
              <div class="relative h-full w-full">
                <img
                  src={buildImageUrl(game.imageKey, "games")}
                  alt={game.name}
                  class="absolute inset-0 h-full w-full object-contain object-center"
                />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r" />
            </a>
          </div>

          <div class="relative space-y-3 overflow-hidden md:col-span-2">
            <div class="flex items-center justify-between gap-3 text-[10px] font-black tracking-[0.18em] text-cyan-200">
              {isReleaseToday && (
                <span class="birthday-badge inline-flex items-center rounded-full border border-amber-100/70 bg-gradient-to-r from-amber-300 via-cyan-200 to-emerald-300 px-3 py-1 text-[10px] font-black tracking-[0.12em] text-slate-950 shadow-lg shadow-cyan-300/20">
                  Happy Birthday!!
                </span>
              )}
              <div class="ml-auto shrink-0">
                <GameFavoriteButton code={game.code} variant="card" />
              </div>
            </div>

            {(catchCopy || subCatch) && (
              <div class="space-y-1 rounded-xl border border-cyan-300/20 bg-black/15 px-3 py-2">
                {catchCopy && (
                  <p
                    class={compact
                      ? "text-xs font-extrabold leading-snug text-cyan-50 sm:text-sm"
                      : "text-sm font-extrabold leading-snug text-cyan-50 sm:text-base"}
                  >
                    {catchCopy}
                  </p>
                )}
                {subCatch && (
                  <p
                    class={compact
                      ? "border-l-2 border-cyan-300/45 pl-2 text-[11px] leading-relaxed text-cyan-100/90 sm:text-xs"
                      : "border-l-2 border-cyan-300/45 pl-2 text-xs leading-relaxed text-cyan-100/90 sm:text-sm"}
                  >
                    {subCatch}
                  </p>
                )}
              </div>
            )}

            <div
              class={compact
                ? "grid gap-1 text-[11px] text-slate-100 sm:grid-cols-2"
                : "grid gap-1.5 text-[12px] text-slate-100 sm:grid-cols-2"}
            >
              <p class="spotlight-row">
                <span>メーカー</span>
                <strong class="max-w-[62%] overflow-hidden text-ellipsis whitespace-nowrap text-right">
                  {game.manufacturer?.name || "-"}
                </strong>
              </p>
              <p class="spotlight-row">
                <span>機種</span>
                <strong>{game.machine?.name || "-"}</strong>
              </p>
              <p class="spotlight-row">
                <span>ジャンル</span>
                <strong>{formatGenre(game)}</strong>
              </p>
              <p class="spotlight-row">
                <span>価格</span>
                <strong>{formatPrice(game.listPrice)}</strong>
              </p>
              <p class="spotlight-row">
                <span>発売日</span>
                <strong class="flex items-center gap-2">
                  <span>{formatReleaseDate(game.releaseDate)}</span>
                  {isReleaseToday && (
                    <span class="inline-flex items-center rounded-full border border-cyan-200/45 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-black tracking-[0.12em] text-cyan-100">
                      TODAY
                    </span>
                  )}
                </strong>
              </p>
            </div>

            {keywordItems.length > 0 && (
              <section
                class={compact
                  ? "rounded-xl border border-cyan-300/25 bg-black/15 p-2"
                  : "rounded-xl border border-cyan-300/25 bg-black/15 p-3"}
              >
                <p
                  class={compact
                    ? "text-[9px] font-black tracking-[0.16em] text-cyan-200"
                    : "text-[10px] font-black tracking-[0.16em] text-cyan-200"}
                >
                  KEYWORDS
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  {keywordItems.map((keyword) => (
                    <span class="inline-flex max-w-full rounded-full border border-cyan-200/25 bg-cyan-300/12 px-3 py-1 text-[11px] font-semibold text-cyan-50">
                      {keyword}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <div class="grid gap-3 md:grid-cols-2 md:items-start">
              {youtubeEmbed && (
                <section
                  class={compact
                    ? "rounded-xl border border-cyan-300/25 bg-black/15 p-2 md:col-span-1"
                    : "rounded-xl border border-cyan-300/25 bg-black/15 p-3 md:col-span-1"}
                >
                  <p
                    class={compact
                      ? "text-[9px] font-black tracking-[0.16em] text-cyan-200"
                      : "text-[10px] font-black tracking-[0.16em] text-cyan-200"}
                  >
                    YOUTUBE
                  </p>
                  <div class="mt-2 aspect-video overflow-hidden rounded-lg border border-cyan-300/30 bg-black/20">
                    <iframe
                      class="h-full w-full"
                      src={youtubeEmbed}
                      title={`${game.name} movie`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {hasActionButtons && (
                <section
                  class={compact
                    ? "rounded-xl border border-cyan-300/25 bg-black/15 p-2"
                    : "rounded-xl border border-cyan-300/25 bg-black/15 p-3"}
                >
                  <p
                    class={compact
                      ? "text-[9px] font-black tracking-[0.16em] text-cyan-200"
                      : "text-[10px] font-black tracking-[0.16em] text-cyan-200"}
                  >
                    OFFICIAL & BUY
                  </p>
                  <div
                    class={compact
                      ? "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                      : "mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2"}
                  >
                    {game.officialSiteUrl && (
                      <a
                        href={buildOutboundHref(
                          game.officialSiteUrl,
                          game.code,
                          "OFFICIAL",
                          "top_spotlight",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        class={compact
                          ? "group relative inline-flex min-h-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/55 bg-cyan-400/20 px-3 py-2 text-center text-xs font-bold text-cyan-50 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:bg-cyan-400/30 hover:shadow-[0_12px_30px_rgba(34,211,238,0.18)]"
                          : "group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/55 bg-cyan-400/20 px-4 py-3 text-center text-sm font-bold text-cyan-50 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:bg-cyan-400/30 hover:shadow-[0_12px_30px_rgba(34,211,238,0.18)]"}
                      >
                        <span class="relative z-10">公式サイト</span>
                        <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/30 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                      </a>
                    )}
                    {purchaseLinks.map((item) => (
                      <a
                        href={buildOutboundHref(
                          item.url,
                          game.code,
                          item.category,
                          "top_spotlight",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        class={compact
                          ? "group relative inline-flex min-h-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-900/45 px-3 py-2 text-center text-xs font-bold text-cyan-100 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-slate-800/70 hover:shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
                          : "group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-900/45 px-4 py-3 text-center text-sm font-bold text-cyan-100 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-slate-800/70 hover:shadow-[0_12px_30px_rgba(15,23,42,0.25)]"}
                      >
                        <span class="relative z-10">{item.label}</span>
                        <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/25 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function SectionHeader(
  { title, subtitle, href, showViewAll = false }: {
    title: string;
    subtitle: string;
    href?: string;
    showViewAll?: boolean;
  },
) {
  return (
    <div class="section-header">
      <div>
        <h2 class="section-title">{title}</h2>
        <p class="section-eyebrow mt-2">{subtitle}</p>
      </div>
      {href && showViewAll && (
        <a href={href} class="section-view-btn">
          View All
        </a>
      )}
    </div>
  );
}

function _SpotlightCard({ game }: { game: GameItem }) {
  const youtubeEmbed = toYouTubeEmbed(game.youtubeUrl);
  const catchCopy = game.catchCopy?.trim() || "";
  const subCatch = game.subCatch?.trim() || "";
  const purchaseLinks = (game.affiliates || [])
    .filter((item) => item.url?.trim())
    .map((item) => ({
      label: formatAffiliateLabel(item.category),
      url: item.url.trim(),
      category: item.category,
    }));
  const hasActionButtons = Boolean(game.officialSiteUrl) ||
    purchaseLinks.length > 0;
  const rowMinHeightClass = youtubeEmbed
    ? "md:min-h-[520px]"
    : "md:min-h-[360px]";

  return (
    <article class="spotlight-card soft-rise relative overflow-hidden rounded-3xl">
      <div
        class={`grid gap-3 p-3 sm:p-4 md:grid-cols-3 md:items-stretch md:gap-4 ${rowMinHeightClass}`}
      >
        <a
          href={`/app/games/${game.code}`}
          class="relative block h-[220px] overflow-hidden rounded-2xl md:col-span-1 md:h-full md:self-stretch"
        >
          <div class="relative h-full w-full">
            <img
              src={buildImageUrl(game.imageKey, "games")}
              alt={game.name}
              class="absolute inset-0 h-full w-full object-contain object-center"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r" />
          <div class="absolute left-3 top-3 z-10 flex max-w-[88%] flex-col items-start gap-1">
            {(game.keywords || []).slice(0, 2).map((keyword) => (
              <span class="inline-flex max-w-full truncate rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                {keyword.name}
              </span>
            ))}
          </div>
        </a>

        <div class="relative space-y-3 overflow-hidden md:col-span-2">
          <p class="text-[10px] font-black tracking-[0.18em] text-cyan-200">
            PICK 1
          </p>
          <a href={`/app/games/${game.code}`} class="block">
            <h3 class="line-clamp-1 text-xl font-black text-white sm:text-2xl">
              {game.name}
            </h3>
          </a>

          {(catchCopy || subCatch) && (
            <div class="space-y-1 rounded-xl border border-cyan-300/20 bg-black/15 px-3 py-2">
              {catchCopy && (
                <p class="text-sm font-extrabold leading-snug text-cyan-50 sm:text-base">
                  {catchCopy}
                </p>
              )}
              {subCatch && (
                <p class="border-l-2 border-cyan-300/45 pl-2 text-xs leading-relaxed text-cyan-100/90 sm:text-sm">
                  {subCatch}
                </p>
              )}
            </div>
          )}

          <div class="grid gap-1.5 text-[12px] text-slate-100 sm:grid-cols-2">
            <p class="spotlight-row">
              <span>メーカー</span>
              <strong class="max-w-[62%] overflow-hidden text-ellipsis whitespace-nowrap text-right">
                {game.manufacturer?.name || "-"}
              </strong>
            </p>
            <p class="spotlight-row">
              <span>機種</span>
              <strong>{game.machine?.name || "-"}</strong>
            </p>
            <p class="spotlight-row">
              <span>ジャンル</span>
              <strong>{formatGenre(game)}</strong>
            </p>
            <p class="spotlight-row">
              <span>価格</span>
              <strong>{formatPrice(game.listPrice)}</strong>
            </p>
            <p class="spotlight-row">
              <span>発売日</span>
              <strong>{formatReleaseDate(game.releaseDate)}</strong>
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-2 md:items-start">
            {youtubeEmbed && (
              <section class="rounded-xl border border-cyan-300/25 bg-black/15 p-3 md:col-span-1">
                <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
                  YOUTUBE
                </p>
                <div class="mt-2 aspect-video overflow-hidden rounded-lg border border-cyan-300/30 bg-black/20">
                  <iframe
                    class="h-full w-full"
                    src={youtubeEmbed}
                    title={`${game.name} movie`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {hasActionButtons && (
              <section class="rounded-xl border border-cyan-300/25 bg-black/15 p-3">
                <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
                  OFFICIAL & BUY
                </p>
                <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {game.officialSiteUrl && (
                    <a
                      href={buildOutboundHref(
                        game.officialSiteUrl,
                        game.code,
                        "OFFICIAL",
                        "top_spotlight_legacy",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/55 bg-cyan-400/20 px-4 py-3 text-center text-sm font-bold text-cyan-50 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:bg-cyan-400/30 hover:shadow-[0_12px_30px_rgba(34,211,238,0.18)]"
                    >
                      <span class="relative z-10">公式サイト</span>
                      <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/30 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                    </a>
                  )}
                  {purchaseLinks.map((item) => (
                    <a
                      href={buildOutboundHref(
                        item.url,
                        game.code,
                        item.category,
                        "top_spotlight_legacy",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-900/45 px-4 py-3 text-center text-sm font-bold text-cyan-100 shadow-[0_0_0_rgba(0,0,0,0)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-slate-800/70 hover:shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
                    >
                      <span class="relative z-10">{item.label}</span>
                      <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/25 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function _SmallPickCard({ game, order }: { game: GameItem; order: number }) {
  return (
    <a
      href={`/app/games/${game.code}`}
      class="soft-rise group block overflow-hidden rounded-2xl border border-sky-200 bg-white"
    >
      <div class="grid h-full grid-cols-[118px_1fr] gap-0">
        <div class="h-full overflow-hidden">
          <img
            src={buildImageUrl(game.imageKey, "games")}
            alt={game.name}
            class="h-full min-h-[130px] w-full object-cover object-center"
          />
        </div>
        <div class="flex min-h-[130px] flex-col justify-center p-3">
          <p class="text-[10px] font-black tracking-[0.16em] text-sky-600">
            PICK {order}
          </p>
          <p class="line-clamp-2 text-sm font-black text-slate-900 group-hover:text-sky-700">
            {game.name}
          </p>
          <div class="mt-1 flex flex-wrap gap-1 text-[10px]">
            <span class="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
              {game.genre?.name || "Genre"}
            </span>
            <span class="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
              {game.machine?.name || "Hard"}
            </span>
          </div>
          <p class="mt-2 text-[10px] text-slate-500">
            {formatReleaseDate(game.releaseDate)} リリース
          </p>
        </div>
      </div>
    </a>
  );
}

function SpotlightSection({ games }: { games: GameItem[] }) {
  const lead = games[0];
  const sub = games.slice(1);

  if (!lead) {
    return (
      <section class="rounded-3xl public-glass p-6">
        <p class="text-sm text-slate-600">おすすめ作品は準備中です。</p>
      </section>
    );
  }

  return (
    <section class="rounded-3xl public-glass p-4 sm:p-6">
      <SectionHeader
        title="Today Spotlight Picks"
        subtitle="今日のスポットライト"
        href="/app/games"
        showViewAll={false}
      />

      <div class="mt-5 p-1 sm:p-2">
        <SpotlightDetailCard game={lead} />

        <div class="mt-8 grid gap-x-8 gap-y-14 md:grid-cols-2 xl:gap-x-9 xl:gap-y-16">
          {sub.map((game) => (
            <SpotlightDetailCard
              game={game}
              compact
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RankingBadge({ rank }: { rank?: number }) {
  const rankTextClass = "text-[10px]";
  const topRankStyle = {
    1: "border-amber-100 bg-amber-400 text-white shadow-amber-950/30",
    2: "border-slate-100 bg-slate-300 text-white shadow-slate-950/30",
    3: "border-orange-100 bg-orange-500 text-white shadow-orange-950/30",
  }[rank ?? 0];
  const crownStyle = {
    1: "text-amber-300",
    2: "text-slate-200",
    3: "text-orange-300",
  }[rank ?? 0];

  if (topRankStyle) {
    return (
      <div class="absolute left-2 top-2 z-10 h-12 w-10">
        <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span
          class={`relative flex h-10 w-10 flex-col items-center justify-center overflow-hidden rounded-full border-2 text-center font-black leading-none shadow-md ${topRankStyle}`}
        >
          <span aria-hidden="true" class="ranking-medal-shine" />
          <span
            aria-hidden="true"
            class={`absolute left-1/2 top-[-0.9rem] z-10 -translate-x-1/2 text-lg leading-none drop-shadow-sm ${crownStyle}`}
          >
            ♛
          </span>
          <span class="absolute top-1 text-[6px] font-black uppercase leading-none">
            No
          </span>
          <span class={rankTextClass}>{rank}</span>
        </span>
      </div>
    );
  }

  if (rank) {
    return (
      <div class="absolute left-2 top-2 z-10 h-12 w-10">
        <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 border-cyan-100 bg-cyan-600 font-black leading-none text-white shadow-md shadow-slate-950/30">
          <span class="absolute top-1 text-[6px] font-black uppercase leading-none">
            No
          </span>
          <span class={rankTextClass}>{rank}</span>
        </span>
      </div>
    );
  }

  return (
    <div class="absolute left-2 top-2 z-10 rounded-full border border-slate-200/70 bg-slate-950/85 px-2.5 py-1 text-[11px] font-black text-slate-100 shadow-sm">
      圏外
    </div>
  );
}

function TopGameCard({ game }: { game: GameItem }) {
  const filterHref = (
    key: "manufacturerCode" | "machineCode" | "genreCode" | "keywordCode",
    value?: string,
  ) => {
    if (!value) return "/app/games";
    return `/app/games?${key}=${encodeURIComponent(value)}`;
  };
  const detailHref = `/app/games/${game.code}`;

  return (
    <div class="soft-rise group w-full min-w-0">
      <a href={detailHref} class="mb-1 block">
        <p class="game-card-floating-title line-clamp-2 min-h-[2.35rem] text-sm font-extrabold leading-tight">
          {game.name}
        </p>
      </a>

      <article class="game-info-card relative block w-full max-w-full overflow-hidden rounded-2xl border border-sky-200/70">
        <div class="relative">
          <a href={detailHref} class="block">
            <img
              src={buildImageUrl(game.imageKey, "games")}
              alt={game.name}
              class="h-44 w-full object-cover"
            />
          </a>
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <RankingBadge rank={game.rank} />
          <div class="absolute right-3 top-3 z-10">
            <GameFavoriteButton code={game.code} variant="card" />
          </div>
        </div>

        <div class="space-y-3 p-3">
          <p class="h-6 truncate text-xs leading-[1.1rem] text-slate-600">
            {game.catchCopy || ""}
          </p>

          <p class="text-[10px] font-black tracking-[0.14em] text-slate-500">
            GAME INFO
          </p>

          <div class="space-y-1.5 text-[12px] text-slate-700">
            <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
              <span>メーカー</span>
              <strong class="max-w-[62%] truncate text-right text-slate-800">
                <a
                  href={filterHref("manufacturerCode", game.manufacturer?.code)}
                  class="block truncate hover:text-sky-700 hover:underline"
                >
                  {game.manufacturer?.name || "-"}
                </a>
              </strong>
            </p>
            <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
              <span>機種</span>
              <strong class="max-w-[62%] truncate text-right text-slate-800">
                <a
                  href={filterHref("machineCode", game.machine?.code)}
                  class="block truncate hover:text-sky-700 hover:underline"
                >
                  {game.machine?.name || "-"}
                </a>
              </strong>
            </p>
            <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
              <span>ジャンル</span>
              <strong class="max-w-[62%] truncate text-right text-slate-800">
                <a
                  href={filterHref("genreCode", game.genre?.code)}
                  class="block truncate hover:text-sky-700 hover:underline"
                >
                  {game.genre?.name || "-"}
                </a>
              </strong>
            </p>
            <div class="grid gap-1.5 sm:grid-cols-2">
              <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
                <span>価格</span>
                <strong class="max-w-[62%] truncate text-right text-slate-800">
                  {formatPrice(game.listPrice)}
                </strong>
              </p>
              <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
                <span>発売日</span>
                <strong class="max-w-[72%] truncate text-right text-slate-800">
                  {formatReleaseDate(game.releaseDate)}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function TopGameStrip(
  {
    title,
    subtitle,
    games = [],
    href,
    showViewAll = false,
    emptyMessage = "該当ゲームは準備中です。",
  }: {
    title: string;
    subtitle: string;
    games?: GameItem[];
    href: string;
    showViewAll?: boolean;
    emptyMessage?: string;
  },
) {
  return (
    <section class="rounded-3xl public-glass p-5 sm:p-6">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        href={href}
        showViewAll={showViewAll}
      />
      {games.length === 0
        ? <p class="mt-4 text-sm text-cyan-100/80">{emptyMessage}</p>
        : (
          <div class="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-9">
            {games.map((g) => <TopGameCard key={g.code} game={g} />)}
          </div>
        )}
    </section>
  );
}

function CatalogShowcase(
  { title, subtitle, items, queryKey, resourceDir }: {
    title: string;
    subtitle: string;
    items: CatalogItem[];
    queryKey: string;
    resourceDir: "machines" | "genres" | "manufacturers";
  },
) {
  const sorted = [...items].sort((a, b) => b.gameCount - a.gameCount);

  return (
    <section class="rounded-3xl public-glass p-5 sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} href="/app/games" />

      <div class="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-9">
        {sorted.map((item) => (
          <div class="soft-rise group w-full min-w-0">
            <a
              href={`/app/games?${queryKey}=${encodeURIComponent(item.code)}`}
              class="mb-1 block"
            >
              <p class="game-card-floating-title truncate text-base font-black sm:text-lg">
                {item.name}
              </p>
            </a>
            <a
              href={`/app/games?${queryKey}=${encodeURIComponent(item.code)}`}
              class="relative block min-h-[180px] w-full max-w-full overflow-hidden rounded-2xl border border-sky-200/70"
            >
              <img
                src={buildImageUrl(item.imageKey, resourceDir)}
                alt={item.name}
                class="absolute inset-0 h-full w-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div class="absolute bottom-3 left-3 right-3">
                <p class="text-xs font-semibold text-sky-100">
                  {item.gameCount} games
                </p>
              </div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function KeywordMotion({ keywords }: { keywords: KeywordItem[] }) {
  const allKeywords = keywords
    .filter((k) => k.code?.trim() && k.name?.trim())
    .filter((k, index, arr) =>
      arr.findIndex((x) => x.code === k.code) === index
    );
  const shuffled = shuffleItems(allKeywords);
  const firstTrack = [...shuffled, ...shuffled];
  const secondTrack = [...shuffled, ...shuffled];
  const motionScale = Math.max(1, shuffled.length / 20);
  const firstDuration = Math.round(46 * motionScale);
  const secondDuration = Math.round(54 * motionScale);

  return (
    <section class="space-y-4 rounded-3xl public-glass p-5 sm:p-6">
      <SectionHeader
        title="Keyword Wave"
        subtitle="注目キーワード"
        href="/app/games"
      />

      {shuffled.length === 0 && (
        <p class="text-sm text-cyan-100/80">キーワードは準備中です。</p>
      )}

      <div class="keyword-marquee mt-2">
        <div
          class="keyword-marquee-track"
          style={`animation-duration: ${firstDuration}s;`}
        >
          {firstTrack.map((k) => (
            <a
              href={`/app/games?keywordCode=${encodeURIComponent(k.code)}`}
              class="public-chip rounded-full px-3 py-1.5 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700"
            >
              {k.name}
            </a>
          ))}
        </div>
      </div>

      <div class="keyword-marquee">
        <div
          class="keyword-marquee-track reverse"
          style={`animation-duration: ${secondDuration}s;`}
        >
          {secondTrack.map((k) => (
            <a
              href={`/app/games?keywordCode=${encodeURIComponent(k.code)}`}
              class="public-chip rounded-full px-3 py-1.5 text-xs font-semibold hover:border-sky-300 hover:text-sky-700"
            >
              {k.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsSection({ announcements }: { announcements: AnnouncementItem[] }) {
  const items = announcements.slice(0, 3);

  return (
    <section class="rounded-3xl public-glass p-5 sm:p-6">
      <SectionHeader
        title="Latest Announcements"
        subtitle="更新のお知らせ"
        href="/announcements"
        showViewAll
      />
      <div class="mt-4 grid gap-3 md:grid-cols-3">
        {items.length === 0
          ? <p class="text-sm text-cyan-100/80">お知らせは準備中です。</p>
          : items.map((item) => (
            <a
              href={`/announcements/${item.id}`}
              class="block rounded-2xl border border-cyan-300/20 bg-black/15 p-4 transition hover:border-cyan-200/45 hover:bg-black/25"
            >
              <p class="text-xs font-semibold tracking-[0.12em] text-cyan-200/80">
                {item.publishedAt?.slice(0, 10) || item.createdAt.slice(0, 10)}
              </p>
              <p class="mt-2 line-clamp-2 text-sm font-bold text-white">
                {item.title}
              </p>
              <p class="mt-2 line-clamp-3 text-xs text-cyan-50/75">
                {item.excerpt}
              </p>
            </a>
          ))}
      </div>
    </section>
  );
}

export default function Home({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return <BackendUnavailablePage retryHref={data.retryHref || "/"} />;
  }

  const spotlightGames = buildSpotlightGames(data.top);
  return (
    <div class="public-bg flex h-full flex-col">
      <SeoHead
        description="PACKAGE FROESSTは、名作ゲーム・神ゲー・ランキング・機種別ゲームを探せるゲームアーカイブサイトです。"
        path="/"
      />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <section class="hero-stage relative min-h-[68vh] sm:min-h-[76vh]">
        <img
          src="/key-visual.png"
          alt="Key visual"
          class="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/45 to-[#060b16]/90" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.30),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(34,197,94,0.20),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.34),transparent_42%)]" />

        <PublicHeader />

        <div class="relative z-10 flex min-h-[68vh] items-end px-4 pb-8 pt-24 sm:min-h-[76vh] sm:px-8 sm:pb-12 lg:px-12">
          <div class="max-w-4xl space-y-3">
            <p class="text-[11px] font-black tracking-[0.22em] text-cyan-200/90">
              CURATED GAME ARCHIVE
            </p>
            <h1 class="text-3xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              CHOOSE YOUR NEXT
              <br />
              OBSESSION.
            </h1>
            <p class="max-w-2xl text-sm text-cyan-50/90 sm:text-base">
              管理人の愛蔵パッケージ。名作しかない、珠玉のラインナップ。
            </p>
          </div>
        </div>
      </section>

      <main class="relative z-10 mt-6 w-full space-y-6 px-3 pb-8 sm:mt-8 sm:space-y-8 sm:px-6 lg:mt-10 lg:px-10">
        <SpotlightSection games={spotlightGames} />

        <PublicBannerSlider banners={data.topAboveBanners} />

        <NewsSection announcements={data.announcements} />

        <TopGameStrip
          title="Recently Released Games"
          subtitle="新着リリース"
          games={data.top.recentlyReleased ?? []}
          href="/app/games"
          showViewAll={false}
        />

        <TopGameStrip
          title="Recently Registered Games"
          subtitle="新規登録タイトル"
          games={data.top.recentlyUpdated ?? []}
          href="/app/games?sort=recent"
          showViewAll={false}
        />

        <TopGameStrip
          title="Latest Ranking TOP 20"
          subtitle="最新ゲームランキング"
          games={data.top.rankingTop20 ?? []}
          href="/app/rankings"
          showViewAll
          emptyMessage="最新のランキングが発表されていません"
        />

        <KeywordMotion keywords={data.keywords} />

        <CatalogShowcase
          title="Browse by Platform"
          subtitle="機種で探す"
          items={data.machines}
          queryKey="machineCode"
          resourceDir="machines"
        />
        <CatalogShowcase
          title="Browse by Genre"
          subtitle="ジャンルで探す"
          items={data.genres}
          queryKey="genreCode"
          resourceDir="genres"
        />
        <CatalogShowcase
          title="Browse by Publisher"
          subtitle="メーカーで探す"
          items={data.manufacturers}
          queryKey="manufacturerCode"
          resourceDir="manufacturers"
        />

        <TopGameStrip
          title="Random Picks"
          subtitle="気まぐれピックアップ"
          games={data.top.randomPicks ?? []}
          href="/app/games?sort=random"
          showViewAll={false}
        />
        <PublicBannerSlider banners={data.topBelowBanners} />
      </main>
    </div>
  );
}
