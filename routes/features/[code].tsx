// deno-lint-ignore-file react-no-danger
// 管理画面で作成した特集本文HTMLを表示するページです。
import { type Handlers, type PageProps } from "$fresh/server.ts";
import GameFavoriteButton from "../../islands/app/GameFavoriteButton.tsx";
import {
  AppHttpError,
  type FeatureItem,
  fetchFeatureByCode,
  type GameItem,
} from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";
import { getCookieValue } from "../../utils/publicEvent.ts";
import { canonicalUrl } from "../../utils/seo.tsx";
import BackendUnavailablePage from "../_backend_unavailable_page.tsx";
import SitePage from "../_site_page.tsx";

interface PageData {
  item?: FeatureItem;
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const code = ctx.params.code?.trim();
    if (!code) return ctx.renderNotFound();

    try {
      const visitorId = getCookieValue(
        req.headers.get("cookie") || "",
        "visitor_id",
      );
      const item = await fetchFeatureByCode(code, visitorId);
      return ctx.render({ item });
    } catch (error) {
      if (error instanceof AppHttpError && error.status === 404) {
        return ctx.renderNotFound();
      }
      if (
        error instanceof AppHttpError && error.status >= 500 &&
        error.status < 600
      ) {
        const requestUrl = new URL(req.url);
        return ctx.render(
          {
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

function formatDate(value?: string): string {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "-";
  return `${year}/${month}/${day}`;
}

function formatReleaseDate(dateValue?: string): string {
  if (!dateValue) return "-";
  const [year, month, day] = dateValue.slice(0, 10).split("-");
  if (!year || !month || !day) return "-";
  return `${year}年${Number(month)}月${Number(day)}日`;
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
): string {
  const query = new URLSearchParams({
    to,
    gameCode,
    category,
    source: "feature_detail",
  });
  return `/app/out?${query.toString()}`;
}

function FeatureGameCard(
  { game, index }: { game: GameItem; index: number },
) {
  const youtubeEmbed = toYouTubeEmbed(game.youtubeUrl);
  const catchCopy = game.catchCopy?.trim() || "";
  const subCatch = game.subCatch?.trim() || "";
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
  const reverseOnDesktop = index % 2 === 1;
  const rowMinHeightClass = youtubeEmbed
    ? "md:min-h-[520px]"
    : "md:min-h-[360px]";
  const titleSizeClass = game.name.length > 28
    ? "text-base sm:text-xl"
    : "text-lg sm:text-2xl";

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
            class={`relative h-[220px] overflow-hidden rounded-2xl md:col-span-1 md:h-full md:self-stretch ${
              reverseOnDesktop ? "md:order-2" : "md:order-1"
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

          <div
            class={`relative space-y-3 overflow-hidden md:col-span-2 ${
              reverseOnDesktop ? "md:order-1" : "md:order-2"
            }`}
          >
            <div class="flex items-center justify-between gap-3 text-[10px] font-black tracking-[0.18em] text-cyan-200">
              <p>PICK {index + 1}</p>
              <div class="ml-auto shrink-0">
                <GameFavoriteButton code={game.code} variant="card" />
              </div>
            </div>

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

            {keywordItems.length > 0 && (
              <section class="rounded-xl border border-cyan-300/25 bg-black/15 p-3">
                <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
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
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/55 bg-cyan-400/20 px-4 py-3 text-center text-sm font-bold text-cyan-50 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:bg-cyan-400/30"
                      >
                        <span class="relative z-10">公式サイト</span>
                      </a>
                    )}
                    {purchaseLinks.map((item) => (
                      <a
                        href={buildOutboundHref(
                          item.url,
                          game.code,
                          item.category,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-900/45 px-4 py-3 text-center text-sm font-bold text-cyan-100 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-slate-800/70"
                      >
                        <span class="relative z-10">{item.label}</span>
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

export default function FeatureDetailPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return <BackendUnavailablePage retryHref={data.retryHref || "/features"} />;
  }
  if (!data.item) return null;

  const { item } = data;
  const games = item.games ?? [];

  return (
    <SitePage
      title={item.title}
      description={item.excerpt}
      showPageHeader={false}
      canonicalPath={`/features/${item.code}`}
      contentClass="px-1 py-5 sm:px-6 lg:px-10"
      seoType="article"
      keywords={[
        "ゲーム特集",
        "名作ゲーム",
        "神ゲー",
        ...games.map((game) => game.name),
      ]}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        description: item.excerpt,
        url: canonicalUrl(`/features/${item.code}`),
        datePublished: item.publishedAt || item.createdAt,
        dateModified: item.updatedAt,
        about: games.map((game) => ({
          "@type": "VideoGame",
          name: game.name,
          gamePlatform: game.machine?.name,
          genre: game.genre?.name,
          publisher: game.manufacturer?.name,
          datePublished: game.releaseDate,
        })),
      }}
    >
      <article class="space-y-6">
        <section class="px-0 py-1 sm:rounded-2xl sm:border sm:border-cyan-300/20 sm:bg-black/15 sm:p-6">
          <div class="mx-auto max-w-4xl overflow-hidden rounded-xl sm:rounded-2xl sm:border sm:border-cyan-300/20 sm:bg-slate-950/40">
            <img
              src={buildImageUrl(item.thumbnailImageKey, "features")}
              alt=""
              class="aspect-[16/9] max-h-[420px] w-full object-cover"
            />
          </div>
          <div class="px-1 py-4 sm:p-6">
            <a
              href="/features"
              class="text-sm font-semibold text-cyan-200 hover:text-white"
            >
              ← 特集一覧へ
            </a>
            <p class="mt-4 text-xs font-black tracking-[0.18em] text-cyan-200/85">
              {item.code}
            </p>
            <h1 class="mt-2 text-2xl font-black leading-tight text-white sm:text-4xl">
              {item.title}
            </h1>
            <p class="mt-3 text-xs text-cyan-100/70">
              {formatDate(item.publishedAt || item.createdAt)}
            </p>
            <p class="mt-4 max-w-3xl text-sm leading-relaxed text-cyan-50/85 sm:text-base">
              {item.excerpt}
            </p>
            <div
              class="prose prose-invert mt-6 max-w-none"
              dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
            />
          </div>
        </section>

        {games.length > 0 && (
          <section class="space-y-4">
            <div>
              <h2 class="section-title">Featured Games</h2>
              <p class="section-eyebrow mt-2">この特集で紹介するゲーム</p>
            </div>
            <div class="space-y-14 sm:space-y-16">
              {games.map((game, index) => (
                <FeatureGameCard game={game} index={index} />
              ))}
            </div>
          </section>
        )}
      </article>
    </SitePage>
  );
}
