import { type Handlers, type PageProps } from "$fresh/server.ts";
import { buildImageUrl } from "../utils/image.ts";
import {
  appFetch,
  CatalogItem,
  GameItem,
  KeywordItem,
  TopContents,
} from "../utils/appApi.ts";

interface PageData {
  machines: CatalogItem[];
  genres: CatalogItem[];
  manufacturers: CatalogItem[];
  keywords: KeywordItem[];
  top: TopContents;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const [machines, genres, manufacturers, keywords, top] = await Promise.all([
      appFetch<CatalogItem[]>("/app/catalog/machines"),
      appFetch<CatalogItem[]>("/app/catalog/genres"),
      appFetch<CatalogItem[]>("/app/catalog/manufacturers"),
      appFetch<KeywordItem[]>("/app/keywords"),
      appFetch<TopContents>(
        "/app/top?releaseLimit=10&recentLimit=8&randomLimit=8",
      ),
    ]);

    return ctx.render({
      machines,
      genres,
      manufacturers,
      keywords,
      top,
    });
  },
};

function TopGameStrip({ title, games }: { title: string; games: GameItem[] }) {
  return (
    <section class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 class="text-lg font-black text-gray-900">{title}</h3>
      {games.length === 0
        ? <p class="text-sm text-gray-500">該当するゲームはありません。</p>
        : (
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((g) => (
              <a
                href={`/app/games/${g.code}`}
                class="group rounded-xl border border-gray-200 bg-gray-50 p-2 hover:bg-amber-50"
              >
                <img
                  src={buildImageUrl(g.imageKey, "games")}
                  alt={g.name}
                  class="h-28 w-full rounded-lg object-cover"
                />
                <p class="mt-2 line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-orange-700">
                  {g.name}
                </p>
              </a>
            ))}
          </div>
        )}
    </section>
  );
}

function CatalogSection(
  { title, items, queryKey }: {
    title: string;
    items: CatalogItem[];
    queryKey: string;
  },
) {
  return (
    <section class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-black text-gray-900">{title}</h3>
        <a
          href="/app/games"
          class="text-xs font-semibold text-orange-700 hover:text-orange-800"
        >
          一覧検索へ
        </a>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            href={`/app/games?${queryKey}=${encodeURIComponent(item.code)}`}
            class="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 hover:-translate-y-0.5 hover:shadow"
          >
            <img
              src={buildImageUrl(item.imageKey)}
              alt={item.name}
              class="h-14 w-14 rounded-lg border border-gray-200 object-cover"
            />
            <div>
              <p class="font-bold text-gray-900">{item.name}</p>
              <p class="text-xs text-gray-500">登録ゲーム {item.gameCount}件</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function Home({ data }: PageProps<PageData>) {
  return (
    <div class="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#fff4d6,transparent_30%),radial-gradient(circle_at_85%_0%,#d1fae5,transparent_30%),linear-gradient(180deg,#fffaf0,#f8fafc)]">
      <header class="sticky top-0 z-20 border-b border-amber-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" class="text-xl font-black tracking-wide text-gray-900">
            パッケージの森
          </a>

          <details class="relative">
            <summary class="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold">
              メニュー
            </summary>
            <div class="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <form action="/app/games" method="get" class="space-y-2">
                <input
                  type="text"
                  name="q"
                  placeholder="ゲーム名・カナで検索"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  class="w-full rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  検索する
                </button>
              </form>

              <div class="mt-3 border-t pt-3">
                <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500">
                  機種から検索
                </p>
                <div class="grid max-h-48 grid-cols-2 gap-1 overflow-auto text-xs">
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

      <main class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        <section class="rounded-3xl border border-amber-300 bg-white/80 p-5 shadow-sm sm:p-7">
          <p class="text-xs font-semibold tracking-[0.2em] text-orange-700">
            CURATED COLLECTION
          </p>
          <h1 class="mt-2 text-3xl font-black leading-tight text-gray-900 sm:text-5xl">
            厳選された所持ゲームだけを、
            <br />
            物語のように紹介する。
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base">
            無数の作品を並べるのではなく、運営が実際に所有するパッケージから面白さと記憶に残る体験を軸に選抜。機種・ジャンル・メーカーを横断して、あなたに刺さる一本を見つけるためのサイトです。
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <a
              href="/app/games"
              class="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              ゲームを探す
            </a>
            <a
              href="/admin"
              class="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              管理画面
            </a>
          </div>

          <form
            action="/app/games"
            method="get"
            class="mt-5 grid gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 md:grid-cols-5"
          >
            <input
              type="text"
              name="q"
              placeholder="ゲーム名・カナで検索"
              class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <select
              name="machineCode"
              class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">機種を選択</option>
              {data.machines.map((m) => <option value={m.code}>{m.name}
              </option>)}
            </select>
            <select
              name="genreCode"
              class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">ジャンルを選択</option>
              {data.genres.map((g) => <option value={g.code}>{g.name}</option>)}
            </select>
            <select
              name="manufacturerCode"
              class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">メーカーを選択</option>
              {data.manufacturers.map((m) => (
                <option value={m.code}>{m.name}</option>
              ))}
            </select>
            <button
              type="submit"
              class="md:col-span-5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              この条件で探す
            </button>
          </form>
        </section>

        <section class="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5">
          <h3 class="mb-2 text-sm font-black text-teal-800">
            キーワードから探す
          </h3>
          <div class="flex flex-wrap gap-2">
            {data.keywords.map((k) => (
              <a
                href={`/app/games?keywordCode=${encodeURIComponent(k.code)}`}
                class="rounded-full border border-teal-300 bg-white px-3 py-1 text-xs hover:bg-teal-100"
              >
                {k.name} ({k.gameCount})
              </a>
            ))}
          </div>
        </section>

        <CatalogSection
          title="機種一覧"
          items={data.machines}
          queryKey="machineCode"
        />
        <CatalogSection
          title="ジャンル一覧"
          items={data.genres}
          queryKey="genreCode"
        />
        <CatalogSection
          title="メーカー一覧"
          items={data.manufacturers}
          queryKey="manufacturerCode"
        />

        <TopGameStrip
          title="本日が発売日のゲーム"
          games={data.top.releaseToday}
        />
        <TopGameStrip
          title="最近更新されたゲーム"
          games={data.top.recentlyUpdated}
        />
        <TopGameStrip
          title="ランダムピックアップ"
          games={data.top.randomPicks}
        />
      </main>
    </div>
  );
}
