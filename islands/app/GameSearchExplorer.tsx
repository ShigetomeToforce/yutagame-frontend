import { useSignal } from "@preact/signals";
import {
  CatalogItem,
  GameItem,
  KeywordItem,
  searchGames,
  SearchResponse,
} from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";
import GameFavoriteButton from "./GameFavoriteButton.tsx";

interface SearchFilters {
  q: string;
  machineCode: string;
  genreCode: string;
  manufacturerCode: string;
  keywordCode: string;
}

interface Props {
  machines: CatalogItem[];
  genres: CatalogItem[];
  manufacturers: CatalogItem[];
  keywords: KeywordItem[];
  initialFilters: SearchFilters;
  initialResponse: SearchResponse;
}

export default function GameSearchExplorer(props: Props) {
  const filters = useSignal<SearchFilters>({ ...props.initialFilters });
  const games = useSignal<GameItem[]>(props.initialResponse.data || []);
  const page = useSignal<number>(props.initialResponse.page || 1);
  const totalPages = useSignal<number>(props.initialResponse.totalPages || 1);
  const totalCount = useSignal<number>(props.initialResponse.totalCount || 0);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string>("");

  const buildSearchQueryString = (value: SearchFilters): string => {
    const params = new URLSearchParams();
    if (value.q) params.set("q", value.q);
    if (value.machineCode) params.set("machineCode", value.machineCode);
    if (value.genreCode) params.set("genreCode", value.genreCode);
    if (value.manufacturerCode) {
      params.set("manufacturerCode", value.manufacturerCode);
    }
    if (value.keywordCode) params.set("keywordCode", value.keywordCode);
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const syncFiltersToUrl = (value: SearchFilters) => {
    const nextUrl = `/app/games${buildSearchQueryString(value)}`;
    globalThis.history.replaceState(null, "", nextUrl);
  };

  const navigateToDetail = (code: string) => {
    const returnTo =
      `${globalThis.location.pathname}${globalThis.location.search}`;
    globalThis.location.href = `/app/games/${code}?returnTo=${
      encodeURIComponent(returnTo)
    }`;
  };

  const buildFilterHref = (key: keyof SearchFilters, value?: string) => {
    if (!value) return "/app/games";
    return `/app/games?${key}=${encodeURIComponent(value)}`;
  };

  const keywordWaveItems = props.keywords
    .filter((k) => k.code?.trim() && k.name?.trim() && k.gameCount > 0)
    .filter((k, index, arr) =>
      arr.findIndex((x) => x.code === k.code) === index
    )
    .sort((a, b) => b.gameCount - a.gameCount);

  const onKeywordClick = (keywordCode: string) => {
    filters.value = {
      ...filters.value,
      keywordCode,
    };
    syncFiltersToUrl(filters.value);
    void applySearch(1, false);
  };

  const renderKeywordWave = () => {
    if (keywordWaveItems.length === 0) return null;

    const allKeywords = [...keywordWaveItems];
    const shuffled = [...allKeywords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const firstTrack = [...shuffled, ...shuffled];
    const secondTrack = [...shuffled, ...shuffled];
    const motionScale = Math.max(1, shuffled.length / 18);
    const firstDuration = Math.round(46 * motionScale);
    const secondDuration = Math.round(54 * motionScale);

    return (
      <section class="rounded-3xl public-glass p-5 sm:p-6">
        <div class="mb-4 flex items-end justify-between gap-3 border-b border-sky-200/30 pb-3">
          <div>
            <h2 class="mt-1 text-xl font-black text-white sm:text-2xl">
              KEYWORD WAVE
            </h2>
            <p class="text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
              注目キーワード
            </p>
          </div>
        </div>

        <div class="keyword-marquee">
          <div
            class="keyword-marquee-track"
            style={`animation-duration: ${firstDuration}s;`}
          >
            {firstTrack.map((k) => (
              <button
                type="button"
                key={`${k.code}-a`}
                onClick={() => onKeywordClick(k.code)}
                class={filters.value.keywordCode === k.code
                  ? "public-chip rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-300"
                  : "public-chip rounded-full px-3 py-1.5 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700"}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>

        <div class="keyword-marquee mt-3">
          <div
            class="keyword-marquee-track reverse"
            style={`animation-duration: ${secondDuration}s;`}
          >
            {secondTrack.map((k) => (
              <button
                type="button"
                key={`${k.code}-b`}
                onClick={() => onKeywordClick(k.code)}
                class={filters.value.keywordCode === k.code
                  ? "public-chip rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-300"
                  : "public-chip rounded-full px-3 py-1.5 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700"}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const applySearch = async (nextPage: number, append: boolean) => {
    loading.value = true;
    error.value = "";
    try {
      const response = await searchGames({
        ...filters.value,
        page: nextPage,
        limit: 20,
      });

      page.value = response.page;
      totalPages.value = response.totalPages;
      totalCount.value = response.totalCount;
      games.value = append
        ? [...games.value, ...(response.data || [])]
        : (response.data || []);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "検索に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  const onSubmit = (e: Event) => {
    e.preventDefault();
    syncFiltersToUrl(filters.value);
    void applySearch(1, false);
  };

  const hasMore = page.value < totalPages.value;

  const formatReleaseDate = (value?: string) => {
    if (!value) return "-";
    const [year, month, day] = value.slice(0, 10).split("-");
    if (!year || !month || !day) return "-";
    return `${year}年${Number(month)}月${Number(day)}日`;
  };

  const formatPrice = (value?: number) => {
    if (!value || value <= 0) return "-";
    return `${value.toLocaleString()}円`;
  };

  const formatGenre = (game: GameItem) => game.genre?.name || "-";

  return (
    <div class="space-y-6">
      <section class="rounded-3xl public-glass p-4 sm:p-5">
        <form onSubmit={onSubmit} class="space-y-4">
          <div class="grid gap-3">
            <div class="w-full md:w-1/2">
              <label class="block">
                <span class="mb-1.5 block text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
                  FREEWORD
                </span>
                <input
                  type="text"
                  value={filters.value.q}
                  onInput={(e) => {
                    filters.value = {
                      ...filters.value,
                      q: (e.target as HTMLInputElement).value,
                    };
                  }}
                  placeholder="タイトル・カナで検索"
                  class="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-inner shadow-sky-100 placeholder:text-slate-400"
                />
              </label>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label class="block">
                <span class="mb-1.5 block text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
                  MACHINE
                </span>
                <select
                  value={filters.value.machineCode}
                  onChange={(e) => {
                    filters.value = {
                      ...filters.value,
                      machineCode: (e.target as HTMLSelectElement).value,
                    };
                  }}
                  class="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                >
                  <option value="">機種</option>
                  {props.machines.map((m) => (
                    <option value={m.code}>{m.name}</option>
                  ))}
                </select>
              </label>

              <label class="block">
                <span class="mb-1.5 block text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
                  GENRE
                </span>
                <select
                  value={filters.value.genreCode}
                  onChange={(e) => {
                    filters.value = {
                      ...filters.value,
                      genreCode: (e.target as HTMLSelectElement).value,
                    };
                  }}
                  class="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                >
                  <option value="">ジャンル</option>
                  {props.genres.map((g) => (
                    <option value={g.code}>{g.name}</option>
                  ))}
                </select>
              </label>

              <label class="block">
                <span class="mb-1.5 block text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
                  MANUFACTURER
                </span>
                <select
                  value={filters.value.manufacturerCode}
                  onChange={(e) => {
                    filters.value = {
                      ...filters.value,
                      manufacturerCode: (e.target as HTMLSelectElement).value,
                    };
                  }}
                  class="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                >
                  <option value="">メーカー</option>
                  {props.manufacturers.map((m) => (
                    <option value={m.code}>{m.name}</option>
                  ))}
                </select>
              </label>

              <label class="block">
                <span class="mb-1.5 block text-[10px] font-black tracking-[0.18em] text-cyan-200/80">
                  KEYWORD
                </span>
                <select
                  value={filters.value.keywordCode}
                  onChange={(e) => {
                    filters.value = {
                      ...filters.value,
                      keywordCode: (e.target as HTMLSelectElement).value,
                    };
                  }}
                  class="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                >
                  <option value="">キーワード</option>
                  {props.keywords.filter((k) => k.gameCount > 0).map((k) => (
                    <option value={k.code}>{k.name} ({k.gameCount})</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-sky-200/25 pt-3">
            <button
              type="submit"
              disabled={loading.value}
              class="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-60"
            >
              検索する
            </button>
            <button
              type="button"
              onClick={() => {
                filters.value = {
                  q: "",
                  machineCode: "",
                  genreCode: "",
                  manufacturerCode: "",
                  keywordCode: "",
                };
                syncFiltersToUrl(filters.value);
                void applySearch(1, false);
              }}
              class="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              条件をクリア
            </button>
          </div>
        </form>
      </section>

      <div class="flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-black/20 px-4 py-3 text-cyan-50">
        <p class="text-sm font-semibold text-cyan-50 sm:text-base">
          検索結果: {totalCount.value}件
        </p>
        {filters.value.keywordCode && (
          <span class="rounded-full border border-emerald-300 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            keyword: {filters.value.keywordCode}
          </span>
        )}
      </div>

      {error.value && (
        <div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error.value}
        </div>
      )}

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {games.value.map((game) => {
          return (
            <article
              class="soft-rise group cursor-pointer overflow-hidden rounded-2xl border border-sky-200 bg-white transition duration-300 hover:border-emerald-300/70"
              role="link"
              tabIndex={0}
              aria-label={`${game.name} の詳細ページへ`}
              onClick={() => {
                navigateToDetail(game.code);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigateToDetail(game.code);
                }
              }}
            >
              <div class="border-b border-sky-100 bg-sky-50/45 px-4 py-3">
                <h2 class="truncate text-base font-black text-slate-900 group-hover:text-sky-700">
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
                      <a
                        href={buildFilterHref(
                          "manufacturerCode",
                          game.manufacturer?.code,
                        )}
                        onClick={(event) => event.stopPropagation()}
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
                        href={buildFilterHref(
                          "machineCode",
                          game.machine?.code,
                        )}
                        onClick={(event) => event.stopPropagation()}
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
                        href={buildFilterHref("genreCode", game.genre?.code)}
                        onClick={(event) => event.stopPropagation()}
                        class="block truncate hover:text-sky-700 hover:underline"
                      >
                        {formatGenre(game)}
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
          );
        })}
      </div>

      {games.value.length === 0 && !loading.value && !error.value && (
        <div class="rounded-2xl border border-sky-200 bg-white p-10 text-center text-sm text-slate-600">
          条件に一致するゲームが見つかりませんでした。
        </div>
      )}

      {!loading.value && !error.value && renderKeywordWave()}

      {hasMore && (
        <div class="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void applySearch(page.value + 1, true)}
            disabled={loading.value}
            class="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
          >
            {loading.value ? "読み込み中..." : "もっと見る"}
          </button>
        </div>
      )}
    </div>
  );
}
