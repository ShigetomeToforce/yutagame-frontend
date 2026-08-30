import { type Handlers, type PageProps } from "$fresh/server.ts";
import GameSearchExplorer from "../../../islands/app/GameSearchExplorer.tsx";
import {
  appFetch,
  CatalogItem,
  KeywordItem,
  SearchResponse,
} from "../../../utils/appApi.ts";

interface SearchFilters {
  q: string;
  machineCode: string;
  genreCode: string;
  manufacturerCode: string;
  keywordCode: string;
}

interface PageData {
  machines: CatalogItem[];
  genres: CatalogItem[];
  manufacturers: CatalogItem[];
  keywords: KeywordItem[];
  initialFilters: SearchFilters;
  initialResponse: SearchResponse;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const initialFilters: SearchFilters = {
      q: url.searchParams.get("q") || "",
      machineCode: url.searchParams.get("machineCode") || "",
      genreCode: url.searchParams.get("genreCode") || "",
      manufacturerCode: url.searchParams.get("manufacturerCode") || "",
      keywordCode: url.searchParams.get("keywordCode") || "",
    };

    const query = new URLSearchParams({
      page: "1",
      limit: "20",
      q: initialFilters.q,
      machineCode: initialFilters.machineCode,
      genreCode: initialFilters.genreCode,
      manufacturerCode: initialFilters.manufacturerCode,
      keywordCode: initialFilters.keywordCode,
    });

    const [machines, genres, manufacturers, keywords, initialResponse] =
      await Promise.all([
        appFetch<CatalogItem[]>("/app/catalog/machines"),
        appFetch<CatalogItem[]>("/app/catalog/genres"),
        appFetch<CatalogItem[]>("/app/catalog/manufacturers"),
        appFetch<KeywordItem[]>("/app/keywords"),
        appFetch<SearchResponse>(`/app/games?${query.toString()}`),
      ]);

    return ctx.render({
      machines,
      genres,
      manufacturers,
      keywords,
      initialFilters,
      initialResponse,
    });
  },
};

export default function SearchPage({ data }: PageProps<PageData>) {
  return (
    <div class="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-teal-50">
      <header class="sticky top-0 z-20 border-b border-amber-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" class="text-lg font-black tracking-wide text-gray-900">
            パッケージの森
          </a>
          <details class="relative">
            <summary class="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm">
              メニュー
            </summary>
            <div class="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <form action="/app/games" method="get" class="space-y-2">
                <input
                  type="text"
                  name="q"
                  placeholder="ゲーム名で検索"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  class="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
                >
                  検索
                </button>
              </form>

              <div class="mt-3 border-t pt-3">
                <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500">
                  機種から検索
                </p>
                <div class="grid max-h-40 grid-cols-2 gap-1 overflow-auto text-xs">
                  {data.machines.map((m) => (
                    <a
                      href={`/app/games?machineCode=${
                        encodeURIComponent(m.code)
                      }`}
                      class="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
                    >
                      {m.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <h1 class="mb-4 text-2xl font-black text-gray-900 sm:text-3xl">
          ゲーム検索
        </h1>
        <GameSearchExplorer
          machines={data.machines}
          genres={data.genres}
          manufacturers={data.manufacturers}
          keywords={data.keywords}
          initialFilters={data.initialFilters}
          initialResponse={data.initialResponse}
        />
      </main>
    </div>
  );
}
