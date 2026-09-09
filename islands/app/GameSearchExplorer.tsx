import { useSignal } from "@preact/signals";
import {
  CatalogItem,
  GameItem,
  KeywordItem,
  searchGames,
  SearchResponse,
} from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";

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

  const topKeywords = props.keywords
    .filter((k) => k.gameCount > 0)
    .sort((a, b) => b.gameCount - a.gameCount)
    .slice(0, 18);

  const onKeywordClick = (keywordCode: string) => {
    filters.value = {
      ...filters.value,
      keywordCode,
    };
    syncFiltersToUrl(filters.value);
    void applySearch(1, false);
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

  const buildKeywordChips = (game: GameItem) => {
    const blocked = new Set(
      [game.manufacturer?.name, game.machine?.name, game.genre?.name]
        .map((v) => (v || "").trim())
        .filter((v) => v.length > 0),
    );
    const seen = new Set<string>();
    return (game.keywords || [])
      .map((k) => ({
        code: (k.code || "").trim(),
        name: (k.name || "").trim(),
      }))
      .filter((k) => k.code.length > 0 && k.name.length > 0)
      .filter((k) => !blocked.has(k.name))
      .filter((k) => {
        if (seen.has(k.name)) return false;
        seen.add(k.name);
        return true;
      })
      .slice(0, 4);
  };

  return (
    <div class="space-y-6">
      <section class="rounded-3xl public-glass p-4 sm:p-6">
        <form onSubmit={onSubmit} class="grid gap-3 lg:grid-cols-6">
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
            class="lg:col-span-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800"
          />

          <select
            value={filters.value.machineCode}
            onChange={(e) => {
              filters.value = {
                ...filters.value,
                machineCode: (e.target as HTMLSelectElement).value,
              };
            }}
            class="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">機種</option>
            {props.machines.map((m) => <option value={m.code}>{m.name}
            </option>)}
          </select>

          <select
            value={filters.value.genreCode}
            onChange={(e) => {
              filters.value = {
                ...filters.value,
                genreCode: (e.target as HTMLSelectElement).value,
              };
            }}
            class="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">ジャンル</option>
            {props.genres.map((g) => <option value={g.code}>{g.name}</option>)}
          </select>

          <select
            value={filters.value.manufacturerCode}
            onChange={(e) => {
              filters.value = {
                ...filters.value,
                manufacturerCode: (e.target as HTMLSelectElement).value,
              };
            }}
            class="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">メーカー</option>
            {props.manufacturers.map((m) => (
              <option value={m.code}>{m.name}</option>
            ))}
          </select>

          <select
            value={filters.value.keywordCode}
            onChange={(e) => {
              filters.value = {
                ...filters.value,
                keywordCode: (e.target as HTMLSelectElement).value,
              };
            }}
            class="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">キーワード</option>
            {props.keywords.filter((k) => k.gameCount > 0).map((k) => (
              <option value={k.code}>{k.name} ({k.gameCount})</option>
            ))}
          </select>

          <div class="lg:col-span-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading.value}
              class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-60"
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
              class="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-sky-50"
            >
              条件をクリア
            </button>
          </div>
        </form>

        <div class="mt-4">
          <p class="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500">
            POPULAR KEYWORDS
          </p>
          <div class="flex flex-wrap gap-2">
            {topKeywords.map((k) => (
              <button
                type="button"
                onClick={() => onKeywordClick(k.code)}
                class={filters.value.keywordCode === k.code
                  ? "rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700"}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>
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

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {games.value.map((game) => {
          const keywordChips = buildKeywordChips(game);
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
              <div class="relative">
                <img
                  src={buildImageUrl(game.imageKey, "games")}
                  alt={game.name}
                  class="h-56 w-full object-cover"
                />
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              <div class="space-y-3 p-4 text-slate-700">
                <h2 class="line-clamp-2 text-lg font-black text-slate-900 group-hover:text-sky-700">
                  {game.name}
                </h2>
                {game.catchCopy && (
                  <p class="line-clamp-2 text-xs text-slate-600">
                    {game.catchCopy}
                  </p>
                )}

                <div class="space-y-2 text-[11px] text-slate-600">
                  <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <a
                      href={buildFilterHref(
                        "manufacturerCode",
                        game.manufacturer?.code,
                      )}
                      onClick={(event) => event.stopPropagation()}
                      class="inline-flex max-w-full truncate rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-700 hover:bg-sky-200"
                    >
                      {game.manufacturer?.name || "メーカー未設定"}
                    </a>
                    <a
                      href={buildFilterHref("machineCode", game.machine?.code)}
                      onClick={(event) => event.stopPropagation()}
                      class="inline-flex max-w-full truncate rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700 hover:bg-amber-200"
                    >
                      {game.machine?.name || "ハード未設定"}
                    </a>
                    <a
                      href={buildFilterHref("genreCode", game.genre?.code)}
                      onClick={(event) => event.stopPropagation()}
                      class="inline-flex max-w-full truncate rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700 hover:bg-emerald-200"
                    >
                      {game.genre?.name || "ジャンル未設定"}
                    </a>
                  </div>
                  <p>{formatReleaseDate(game.releaseDate)} リリース</p>
                </div>

                <div>
                  <div class="flex flex-wrap gap-1.5">
                    {keywordChips.length === 0
                      ? null
                      : keywordChips.map((k) => (
                        <a
                          href={buildFilterHref("keywordCode", k.code)}
                          onClick={(event) => event.stopPropagation()}
                          class="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                        >
                          {k.name}
                        </a>
                      ))}
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
