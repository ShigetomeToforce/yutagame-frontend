import { type Handlers, type PageProps } from "$fresh/server.ts";
import BackendUnavailablePage from "../../_backend_unavailable_page.tsx";
import GameFavoriteButton from "../../../islands/app/GameFavoriteButton.tsx";
import {
  appFetch,
  AppHttpError,
  type BannerItem,
  fetchPublicBanners,
  GameItem,
} from "../../../utils/appApi.ts";
import PublicBannerSlider from "../../../islands/app/PublicBannerSlider.tsx";
import { buildImageUrl } from "../../../utils/image.ts";
import { getCookieValue } from "../../../utils/publicEvent.ts";
import { canonicalUrl, JsonLd, SeoHead } from "../../../utils/seo.tsx";

interface PageData {
  game?: GameItem;
  returnTo?: string;
  backendUnavailable?: boolean;
  retryHref?: string;
  detailBanners: BannerItem[];
}

function toYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
  return null;
}

function formatReleaseDate(value?: string): string {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "-";
  return `${year}年${Number(month)}月${Number(day)}日`;
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
    source: "game_detail",
  });
  return `/app/out?${query.toString()}`;
}

function TitleRankingBadge({ rank }: { rank?: number }) {
  const rankTextClass = "text-[10px]";
  const topRankStyle = {
    1: "border-amber-100 bg-amber-400 shadow-amber-950/30",
    2: "border-slate-100 bg-slate-300 shadow-slate-950/30",
    3: "border-orange-100 bg-orange-500 shadow-orange-950/30",
  }[rank ?? 0];
  const crownStyle = {
    1: "text-amber-300",
    2: "text-slate-200",
    3: "text-orange-300",
  }[rank ?? 0];

  if (topRankStyle) {
    return (
      <span class="relative inline-flex h-12 w-10 shrink-0">
        <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span
          class={`relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 text-white shadow-md ${topRankStyle}`}
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
          <span
            class={`relative z-10 font-black leading-none ${rankTextClass}`}
          >
            {rank}
          </span>
        </span>
      </span>
    );
  }

  if (rank) {
    return (
      <span class="relative inline-flex h-12 w-10 shrink-0">
        <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-100 bg-cyan-600 font-black leading-none text-white shadow-md shadow-slate-950/30">
          <span class="absolute top-1 text-[6px] font-black uppercase leading-none">
            No
          </span>
          <span class={rankTextClass}>{rank}</span>
        </span>
      </span>
    );
  }

  return (
    <span class="inline-flex shrink-0 rounded-full border border-slate-200/70 bg-slate-950/85 px-2.5 py-1 text-[11px] font-black text-slate-100 shadow-sm">
      圏外
    </span>
  );
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const returnToParam = url.searchParams.get("returnTo") || "";
    const returnTo = returnToParam.startsWith("/app/games")
      ? returnToParam
      : "/app/games";

    try {
      const query = new URLSearchParams();
      const visitorId = getCookieValue(
        req.headers.get("cookie") || "",
        "visitor_id",
      );
      if (visitorId) {
        query.set("visitorId", visitorId);
      }
      const querySuffix = query.toString() ? `?${query.toString()}` : "";
      const [game, detailBanners] = await Promise.all([
        appFetch<GameItem>(`/app/games/${ctx.params.code}${querySuffix}`),
        fetchPublicBanners("game_detail_below", visitorId),
      ]);
      return ctx.render({ game, returnTo, detailBanners });
    } catch (error) {
      if (error instanceof AppHttpError && error.status === 404) {
        return ctx.renderNotFound();
      }
      if (error instanceof AppHttpError && error.status === 503) {
        return ctx.render(
          {
            backendUnavailable: true,
            retryHref: `${url.pathname}${url.search}`,
            detailBanners: [],
          },
          { status: 503 },
        );
      }
      throw error;
    }
  },
};

export default function GameDetailPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return (
      <BackendUnavailablePage retryHref={data.retryHref || "/app/games"} />
    );
  }

  if (!data.game) {
    return null;
  }

  const { game } = data;
  const returnTo = data.returnTo || "/app/games";
  const youtubeEmbed = toYouTubeEmbed(game.youtubeUrl || "");
  const purchaseLinks = (game.affiliates || [])
    .filter((item) => item.url?.trim())
    .map((item) => ({
      label: formatAffiliateLabel(item.category),
      url: item.url.trim(),
      category: item.category,
    }));

  return (
    <div class="public-bg min-h-screen">
      <SeoHead
        title={game.name}
        description={`${game.name}の発売日、メーカー、機種、ジャンル、価格、関連キーワードを確認できます。名作ゲーム・神ゲー探しに役立つゲーム詳細ページです。`}
        path={`/app/games/${game.code}`}
        keywords={[
          game.name,
          game.machine?.name || "",
          game.genre?.name || "",
          game.manufacturer?.name || "",
        ].filter(Boolean)}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: game.name,
          url: canonicalUrl(`/app/games/${game.code}`),
          image: buildImageUrl(game.imageKey, "games"),
          description: game.overview || game.catchCopy || game.name,
          datePublished: game.releaseDate,
          gamePlatform: game.machine?.name,
          genre: game.genre?.name,
          publisher: game.manufacturer?.name,
          offers: game.listPrice > 0
            ? {
              "@type": "Offer",
              price: game.listPrice,
              priceCurrency: "JPY",
            }
            : undefined,
        }}
      />
      <header class="sticky top-0 z-20 border-b border-cyan-300/20 bg-slate-950/75 backdrop-blur-md">
        <div class="flex w-full items-center justify-between px-4 py-3 sm:px-8 lg:px-12">
          <a
            href="/"
            class="inline-flex items-center"
            aria-label="PACKAGE FROESST"
          >
            <img
              src="/logo.png"
              alt="PACKAGE FROESST"
              class="h-10 w-auto max-w-[220px] object-contain sm:h-12"
            />
          </a>
          <a
            href={returnTo}
            class="rounded-lg border border-cyan-200/45 bg-black/35 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-black/50"
          >
            検索へ戻る
          </a>
        </div>
      </header>

      <section class="relative min-h-[36vh] overflow-hidden sm:min-h-[44vh]">
        <img
          src={buildImageUrl(game.imageKey, "games")}
          alt={game.name}
          class="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/55 to-[#060b16]/95" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.18),transparent_38%),radial-gradient(circle_at_50%_88%,rgba(59,130,246,0.28),transparent_40%)]" />

        <div class="relative z-10 w-full px-4 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8 lg:px-12 lg:pb-8 lg:pt-9">
          <div class="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div class="space-y-3">
              <p class="text-[11px] font-black tracking-[0.22em] text-cyan-200/90">
                GAME DETAIL
              </p>
              <div class="flex items-center gap-3">
                <TitleRankingBadge rank={game.rank} />
                <h1 class="max-w-3xl text-2xl font-black leading-[1.05] text-white sm:text-4xl lg:text-5xl">
                  {game.name}
                </h1>
              </div>
              <p class="min-h-5 max-w-2xl text-sm text-cyan-50/90 sm:min-h-6 sm:text-base">
                {game.catchCopy || ""}
              </p>
              {game.subCatch && (
                <p class="max-w-2xl border-l-2 border-cyan-300/45 pl-3 text-sm leading-relaxed text-cyan-100/90 sm:text-base">
                  {game.subCatch}
                </p>
              )}
            </div>

            <div class="rounded-3xl border border-cyan-300/25 bg-black/20 p-3 shadow-2xl backdrop-blur-sm lg:max-w-[320px] lg:justify-self-end">
              <img
                src={buildImageUrl(game.imageKey, "games")}
                alt={game.name}
                class="aspect-[3/4] w-full rounded-2xl border border-cyan-300/25 object-contain object-center bg-black/20"
              />
              <div class="mt-3">
                <GameFavoriteButton code={game.code} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main class="relative z-10 w-full space-y-6 px-4 pb-8 pt-6 sm:space-y-8 sm:px-8 sm:pb-10 lg:px-12">
        <article class="rounded-3xl border border-cyan-300/20 bg-[#081326]/88 p-4 shadow-2xl sm:p-6">
          <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="space-y-5">
              <div class="grid gap-1.5 text-[12px] text-slate-100 sm:grid-cols-2">
                <p class="spotlight-row">
                  <span>メーカー</span>
                  <strong>{game.manufacturer?.name || "-"}</strong>
                </p>
                <p class="spotlight-row">
                  <span>ジャンル</span>
                  <strong>{game.genre?.name || "-"}</strong>
                </p>
                <p class="spotlight-row">
                  <span>機種</span>
                  <strong>{game.machine?.name || "-"}</strong>
                </p>
                <p class="spotlight-row">
                  <span>リリース日</span>
                  <strong>{formatReleaseDate(game.releaseDate)}</strong>
                </p>
                {game.listPrice > 0 && (
                  <p class="spotlight-row sm:col-span-2">
                    <span>価格</span>
                    <strong>{game.listPrice.toLocaleString()}円</strong>
                  </p>
                )}
              </div>

              <section class="space-y-2 rounded-2xl border border-cyan-300/20 bg-black/15 p-4">
                <h2 class="text-lg font-black text-white">概要</h2>
                <p class="whitespace-pre-wrap leading-relaxed text-cyan-50/90">
                  {game.overview}
                </p>
              </section>

              <div class="flex flex-wrap gap-2">
                {game.officialSiteUrl && (
                  <a
                    href={buildOutboundHref(
                      game.officialSiteUrl,
                      game.code,
                      "OFFICIAL",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group relative inline-flex min-h-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/55 bg-cyan-400/20 px-4 py-3 text-center text-sm font-bold text-cyan-50 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-100/80 hover:bg-cyan-400/30"
                  >
                    <span class="relative z-10">公式サイトへ</span>
                    <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/30 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                  </a>
                )}
              </div>

              {purchaseLinks.length > 0 && (
                <section class="rounded-2xl border border-cyan-300/25 bg-black/15 p-4">
                  <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
                    PURCHASE
                  </p>
                  <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {purchaseLinks.map((item) => (
                      <a
                        href={buildOutboundHref(
                          item.url,
                          game.code,
                          item.category,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group relative inline-flex min-h-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-900/45 px-4 py-3 text-center text-sm font-bold text-cyan-100 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-slate-800/70"
                      >
                        <span class="relative z-10">{item.label}</span>
                        <span class="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/25 blur-2xl opacity-0 transition duration-700 group-hover:translate-x-[280%] group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div class="space-y-5">
              <section class="rounded-2xl border border-cyan-300/25 bg-black/15 p-4">
                <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
                  YOUTUBE
                </p>
                {youtubeEmbed
                  ? (
                    <div class="mt-2 aspect-video overflow-hidden rounded-lg border border-cyan-300/30 bg-black/20">
                      <iframe
                        class="h-full w-full"
                        src={youtubeEmbed}
                        title={`${game.name} movie`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )
                  : (
                    <div class="mt-2 flex aspect-video items-center justify-center rounded-lg border border-cyan-300/20 bg-black/10 text-sm text-cyan-100/70">
                      動画は未設定です
                    </div>
                  )}
              </section>

              <section class="rounded-2xl border border-cyan-300/25 bg-black/15 p-4">
                <p class="text-[10px] font-black tracking-[0.16em] text-cyan-200">
                  キーワード
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  {(game.keywords || []).length > 0
                    ? (game.keywords || []).map((k) => (
                      <a
                        href={`/app/games?keywordCode=${
                          encodeURIComponent(k.code)
                        }`}
                        class="rounded-full border border-cyan-200/35 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
                      >
                        {k.name}
                      </a>
                    ))
                    : <span class="text-sm text-cyan-100/70">-</span>}
                </div>
              </section>
            </div>
          </div>
        </article>

        <article class="rounded-3xl border border-cyan-300/20 bg-[#081326]/88 p-4 shadow-2xl sm:p-6">
          <h2 class="text-lg font-black text-white">詳細情報</h2>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[520px] text-sm text-cyan-50/90">
              <tbody>
                <tr class="border-b border-cyan-300/15">
                  <th class="py-3 pr-4 text-left text-cyan-200/80">メーカー</th>
                  <td class="py-3">{game.manufacturer?.name || "-"}</td>
                </tr>
                <tr class="border-b border-cyan-300/15">
                  <th class="py-3 pr-4 text-left text-cyan-200/80">ジャンル</th>
                  <td class="py-3">{game.genre?.name || "-"}</td>
                </tr>
                <tr class="border-b border-cyan-300/15">
                  <th class="py-3 pr-4 text-left text-cyan-200/80">機種</th>
                  <td class="py-3">{game.machine?.name || "-"}</td>
                </tr>
                <tr class="border-b border-cyan-300/15">
                  <th class="py-3 pr-4 text-left text-cyan-200/80">発売日</th>
                  <td class="py-3">{formatReleaseDate(game.releaseDate)}</td>
                </tr>
                {game.listPrice > 0 && (
                  <tr class="border-b border-cyan-300/15">
                    <th class="py-3 pr-4 text-left text-cyan-200/80">価格</th>
                    <td class="py-3">{game.listPrice.toLocaleString()}円</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </main>
      <div class="px-4 pb-8 sm:px-8 lg:px-12">
        <PublicBannerSlider banners={data.detailBanners} />
      </div>
    </div>
  );
}
