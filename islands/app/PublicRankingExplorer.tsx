import { useSignal } from "@preact/signals";
import {
  fetchPublicRanking,
  GameItem,
  SearchResponse,
} from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";
import GameFavoriteButton from "./GameFavoriteButton.tsx";
import PublicBannerSlider from "./PublicBannerSlider.tsx";
import { type BannerItem } from "../../utils/appApi.ts";

type RankingType = "curated" | "views" | "favorites";
type ViewPeriod = "monthly" | "yearly" | "total";

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
      <div class="relative h-12 w-10">
        <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
        <span
          class={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 font-black leading-none shadow-md ${topRankStyle}`}
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

  return (
    <div class="relative h-12 w-10">
      <span class="absolute bottom-0 left-1 h-3.5 w-2 rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
      <span class="absolute bottom-0 right-1 h-3.5 w-2 -rotate-[28deg] bg-red-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]" />
      <span class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-100 bg-cyan-600 font-black leading-none text-white shadow-md shadow-slate-950/30">
        <span class="absolute top-1 text-[6px] font-black uppercase leading-none">
          No
        </span>
        <span class={rankTextClass}>{rank}</span>
      </span>
    </div>
  );
}

function RankingMovement(
  { rank, previousRank }: { rank?: number; previousRank?: number },
) {
  if (!rank) return null;
  if (previousRank === undefined) {
    return (
      <span class="mt-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] text-white shadow-sm">
        NEW
      </span>
    );
  }

  const movement = rank < previousRank
    ? { arrow: "↑", label: "UP", color: "text-red-500" }
    : rank === previousRank
    ? { arrow: "→", label: "STAY", color: "text-amber-400" }
    : { arrow: "↓", label: "DOWN", color: "text-sky-500" };

  return (
    <span
      class={`relative mt-0.5 inline-flex h-9 w-10 items-center justify-center font-black leading-none ${movement.color}`}
    >
      <span class="text-[2.4rem] [-webkit-text-stroke:2px_currentColor]">
        {movement.arrow}
      </span>
      <span class="absolute text-[9px] text-white drop-shadow-sm">
        {movement.label}
      </span>
    </span>
  );
}

export default function PublicRankingExplorer(
  { initialResponse, rankingAboveBanners, rankingBelowBanners }: {
    initialResponse: SearchResponse;
    rankingAboveBanners: BannerItem[];
    rankingBelowBanners: BannerItem[];
  },
) {
  const rankingType = useSignal<RankingType>("curated");
  const period = useSignal<ViewPeriod>("monthly");
  const games = useSignal<GameItem[]>(initialResponse.data || []);
  const page = useSignal(initialResponse.page || 1);
  const totalPages = useSignal(initialResponse.totalPages || 1);
  const loading = useSignal(false);
  const error = useSignal("");

  const loadRanking = async (nextPage: number, append: boolean) => {
    loading.value = true;
    error.value = "";
    try {
      const response = await fetchPublicRanking({
        type: rankingType.value,
        period: rankingType.value === "curated" ? undefined : period.value,
        page: nextPage,
        limit: 20,
      });
      page.value = response.page;
      totalPages.value = response.totalPages;
      games.value = append ? [...games.value, ...response.data] : response.data;
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "ランキングの取得に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  const selectType = (type: RankingType) => {
    rankingType.value = type;
    void loadRanking(1, false);
  };

  const selectPeriod = (nextPeriod: ViewPeriod) => {
    period.value = nextPeriod;
    void loadRanking(1, false);
  };

  const title = rankingType.value === "curated"
    ? "名作ランキング"
    : rankingType.value === "views"
    ? "アクセス数ランキング"
    : "推しゲーランキング";
  const hasMore = page.value < totalPages.value;
  const navigateToDetail = (code: string) => {
    globalThis.location.href = `/app/games/${code}?returnTo=/app/rankings`;
  };

  return (
    <div class="space-y-6">
      <section class="rounded-3xl border border-cyan-300/20 bg-slate-950/60 px-5 py-5 text-cyan-50 shadow-2xl backdrop-blur-md sm:px-6">
        <p class="text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
          GAME RANKINGS
        </p>
        <h1 class="mt-1 text-2xl font-black text-white sm:text-4xl">{title}</h1>
      </section>

      <PublicBannerSlider banners={rankingAboveBanners} />

      <div class="flex flex-wrap gap-2 border-b border-sky-200/25 pb-3">
        {([
          ["curated", "名作ランキング"],
          ["views", "アクセス数ランキング"],
          ["favorites", "推しゲーランキング"],
        ] as [RankingType, string][]).map(([type, label]) => (
          <button
            type="button"
            onClick={() => selectType(type)}
            class={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              rankingType.value === type
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "border border-cyan-200/35 bg-black/20 text-cyan-100 hover:bg-black/35"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rankingType.value !== "curated" && (
        <div class="flex flex-wrap gap-2">
          {([
            ["monthly", "月間"],
            ["yearly", "年間"],
            ["total", "累計"],
          ] as [ViewPeriod, string][]).map(([value, label]) => (
            <button
              type="button"
              onClick={() => selectPeriod(value)}
              class={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                period.value === value
                  ? "bg-cyan-500 text-white"
                  : "border border-cyan-200/35 bg-black/20 text-cyan-100 hover:bg-black/35"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {error.value && (
        <p class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error.value}
        </p>
      )}

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {games.value.map((game) => {
          return (
            <article
              class="soft-rise group cursor-pointer overflow-hidden rounded-2xl border border-sky-200 bg-white transition duration-300 hover:border-emerald-300/70"
              role="link"
              tabIndex={0}
              aria-label={`${game.name} の詳細ページへ`}
              onClick={() => navigateToDetail(game.code)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigateToDetail(game.code);
                }
              }}
            >
              <div class="game-card-titlebar px-4 py-3">
                <h2 class="game-card-title truncate text-base font-black">
                  {game.name}
                </h2>
              </div>
              <div class="relative">
                <img
                  src={buildImageUrl(game.imageKey, "games")}
                  alt={game.name}
                  class="h-56 w-full object-cover"
                />
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div class="absolute left-2 top-2 z-10 flex items-start gap-1">
                  <RankingBadge rank={game.rank} />
                  {rankingType.value === "curated" && (
                    <RankingMovement
                      rank={game.rank}
                      previousRank={game.previousRank}
                    />
                  )}
                </div>
                <div
                  class="absolute right-3 top-3 z-10"
                  onClick={(event) => event.stopPropagation()}
                >
                  <GameFavoriteButton code={game.code} variant="card" />
                </div>
              </div>
              <div class="space-y-3 p-4 text-slate-700">
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
                      {game.manufacturer?.name || "-"}
                    </strong>
                  </p>
                  <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
                    <span>機種</span>
                    <strong class="max-w-[62%] truncate text-right text-slate-800">
                      {game.machine?.name || "-"}
                    </strong>
                  </p>
                  <p class="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/75 px-2 py-1 leading-tight">
                    <span>ジャンル</span>
                    <strong class="max-w-[62%] truncate text-right text-slate-800">
                      {game.genre?.name || "-"}
                    </strong>
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!loading.value && games.value.length === 0 && !error.value && (
        <p class="rounded-2xl border border-dashed border-cyan-200/35 bg-black/15 p-10 text-center text-sm text-cyan-100/80">
          ランキングデータはまだありません。
        </p>
      )}
      {hasMore && (
        <div class="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void loadRanking(page.value + 1, true)}
            disabled={loading.value}
            class="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
          >
            {loading.value ? "読み込み中..." : "View More"}
          </button>
        </div>
      )}
      <PublicBannerSlider banners={rankingBelowBanners} />
    </div>
  );
}
