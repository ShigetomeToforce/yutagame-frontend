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

function toYouTubeEmbed(url: string): string | null {
  if (!url) return null;

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch?.[1]) {
    return `https://www.youtube.com/embed/${embedMatch[1]}`;
  }

  return null;
}

export default function GameSearchExplorer(props: Props) {
  const filters = useSignal<SearchFilters>({ ...props.initialFilters });
  const games = useSignal<GameItem[]>(props.initialResponse.data || []);
  const page = useSignal<number>(props.initialResponse.page || 1);
  const totalPages = useSignal<number>(props.initialResponse.totalPages || 1);
  const totalCount = useSignal<number>(props.initialResponse.totalCount || 0);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string>("");

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
    void applySearch(1, false);
  };

  const onKeywordClick = (keywordCode: string) => {
    filters.value = {
      ...filters.value,
      keywordCode,
    };
    void applySearch(1, false);
  };

  const clearKeyword = () => {
    filters.value = {
      ...filters.value,
      keywordCode: "",
    };
    void applySearch(1, false);
  };

  const hasMore = page.value < totalPages.value;

  return (
    <div class="space-y-6">
      <section class="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6">
        <form onSubmit={onSubmit} class="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            value={filters.value.q}
            onInput={(e) => {
              filters.value = {
                ...filters.value,
                q: (e.target as HTMLInputElement).value,
              };
            }}
            placeholder="ゲーム名・カナで検索"
            class="md:col-span-2 rounded-lg border border-amber-300 px-3 py-2 text-sm"
          />

          <select
            value={filters.value.machineCode}
            onChange={(e) => {
              filters.value = {
                ...filters.value,
                machineCode: (e.target as HTMLSelectElement).value,
              };
            }}
            class="rounded-lg border border-amber-300 px-3 py-2 text-sm"
          >
            <option value="">機種を選択</option>
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
            class="rounded-lg border border-amber-300 px-3 py-2 text-sm"
          >
            <option value="">ジャンルを選択</option>
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
            class="rounded-lg border border-amber-300 px-3 py-2 text-sm"
          >
            <option value="">メーカーを選択</option>
            {props.manufacturers.map((m) => (
              <option value={m.code}>{m.name}</option>
            ))}
          </select>

          <div class="md:col-span-5 flex gap-2">
            <button
              type="submit"
              disabled={loading.value}
              class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
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
                void applySearch(1, false);
              }}
              class="rounded-lg border border-amber-400 px-4 py-2 text-sm"
            >
              条件をクリア
            </button>
          </div>
        </form>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold tracking-wide text-amber-700">
            キーワード検索
          </span>
          {props.keywords.map((k) => (
            <button
              type="button"
              onClick={() => onKeywordClick(k.code)}
              class={`rounded-full px-3 py-1 text-xs transition ${
                filters.value.keywordCode === k.code
                  ? "bg-orange-500 text-white"
                  : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-100"
              }`}
            >
              {k.name} ({k.gameCount})
            </button>
          ))}
          {filters.value.keywordCode && (
            <button
              type="button"
              onClick={clearKeyword}
              class="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs"
            >
              キーワード解除
            </button>
          )}
        </div>
      </section>

      <p class="text-sm text-gray-600">検索結果: {totalCount.value}件</p>

      {error.value && (
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </div>
      )}

      <div class="space-y-4">
        {games.value.map((game) => {
          const youtubeEmbed = toYouTubeEmbed(game.youTubeUrl || "");
          return (
            <article class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div class="flex flex-col gap-4 md:flex-row">
                <img
                  src={buildImageUrl(game.imageKey, "games")}
                  alt={game.name}
                  class="h-44 w-full rounded-xl border border-gray-200 object-cover md:w-60"
                />

                <div class="flex-1 space-y-3">
                  <p class="text-xs font-semibold text-orange-600">
                    {game.catchCopy || "キャッチコピー準備中"}
                  </p>
                  <h2 class="text-2xl font-bold text-gray-900">{game.name}</h2>

                  <table class="w-full text-sm">
                    <tbody>
                      <tr class="border-b">
                        <th class="w-28 py-1 text-left text-gray-500">
                          メーカー
                        </th>
                        <td>{game.manufacturer?.name || "-"}</td>
                      </tr>
                      <tr class="border-b">
                        <th class="w-28 py-1 text-left text-gray-500">
                          ジャンル
                        </th>
                        <td>{game.genre?.name || "-"}</td>
                      </tr>
                      <tr class="border-b">
                        <th class="w-28 py-1 text-left text-gray-500">機種</th>
                        <td>{game.machine?.name || "-"}</td>
                      </tr>
                      <tr class="border-b">
                        <th class="w-28 py-1 text-left text-gray-500">
                          キーワード
                        </th>
                        <td class="py-1">
                          <div class="flex flex-wrap gap-1">
                            {(game.keywords || []).map((k) => (
                              <button
                                type="button"
                                onClick={() => onKeywordClick(k.code)}
                                class="rounded-full bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
                              >
                                {k.name}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr class="border-b">
                        <th class="w-28 py-1 text-left text-gray-500">
                          リリース日
                        </th>
                        <td>{game.releaseDate?.slice(0, 10) || "-"}</td>
                      </tr>
                      {game.listPrice > 0 && (
                        <tr class="border-b">
                          <th class="w-28 py-1 text-left text-gray-500">
                            価格
                          </th>
                          <td>{game.listPrice.toLocaleString()}円</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div class="flex flex-wrap gap-2">
                    <a
                      href={`/app/games/${game.code}`}
                      class="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      詳細を見る
                    </a>
                    {game.officialSiteUrl && (
                      <a
                        href={game.officialSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                      >
                        公式サイト
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {youtubeEmbed && (
                <div class="mt-4 overflow-hidden rounded-xl border border-gray-200">
                  <iframe
                    class="h-64 w-full"
                    src={youtubeEmbed}
                    title={`${game.name} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div class="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void applySearch(page.value + 1, true)}
            disabled={loading.value}
            class="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading.value ? "読み込み中..." : "もっと見る"}
          </button>
        </div>
      )}
    </div>
  );
}
