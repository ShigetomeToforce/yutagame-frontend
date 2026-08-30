import { type Handlers, type PageProps } from "$fresh/server.ts";
import { appFetch, GameItem } from "../../../utils/appApi.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface PageData {
  game: GameItem;
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

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const game = await appFetch<GameItem>(`/app/games/${ctx.params.code}`);
    return ctx.render({ game });
  },
};

export default function GameDetailPage({ data }: PageProps<PageData>) {
  const { game } = data;
  const youtubeEmbed = toYouTubeEmbed(game.youTubeUrl || "");

  return (
    <div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50">
      <header class="border-b border-amber-200 bg-white/90">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/" class="text-lg font-black text-gray-900">
            パッケージの森
          </a>
          <a
            href="/app/games"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            検索へ戻る
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <article class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-orange-600">
            {game.catchCopy || "キャッチコピー準備中"}
          </p>
          <h1 class="mt-1 text-3xl font-black text-gray-900">{game.name}</h1>
          {game.subCatch && <p class="mt-2 text-gray-700">{game.subCatch}</p>}

          <img
            src={buildImageUrl(game.imageKey, "games")}
            alt={game.name}
            class="mt-5 h-64 w-full rounded-xl border border-gray-200 object-cover"
          />

          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-[480px] text-sm">
              <tbody>
                <tr class="border-b">
                  <th class="py-2 text-left text-gray-500">メーカー</th>
                  <td>{game.manufacturer?.name || "-"}</td>
                </tr>
                <tr class="border-b">
                  <th class="py-2 text-left text-gray-500">ジャンル</th>
                  <td>{game.genre?.name || "-"}</td>
                </tr>
                <tr class="border-b">
                  <th class="py-2 text-left text-gray-500">機種</th>
                  <td>{game.machine?.name || "-"}</td>
                </tr>
                <tr class="border-b">
                  <th class="py-2 text-left text-gray-500">キーワード</th>
                  <td class="py-2">
                    <div class="flex flex-wrap gap-1">
                      {(game.keywords || []).map((k) => (
                        <a
                          href={`/app/games?keywordCode=${
                            encodeURIComponent(k.code)
                          }`}
                          class="rounded-full bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
                        >
                          {k.name}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr class="border-b">
                  <th class="py-2 text-left text-gray-500">リリース日</th>
                  <td>{game.releaseDate?.slice(0, 10) || "-"}</td>
                </tr>
                {game.listPrice > 0 && (
                  <tr class="border-b">
                    <th class="py-2 text-left text-gray-500">価格</th>
                    <td>{game.listPrice.toLocaleString()}円</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <section class="mt-6 space-y-2">
            <h2 class="text-lg font-bold">概要</h2>
            <p class="leading-relaxed text-gray-700 whitespace-pre-wrap">
              {game.overview}
            </p>
          </section>

          <div class="mt-4 flex flex-wrap gap-2">
            {game.officialSiteUrl && (
              <a
                href={game.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              >
                公式サイトへ
              </a>
            )}
          </div>

          {youtubeEmbed && (
            <div class="mt-6 overflow-hidden rounded-xl border border-gray-200">
              <iframe
                class="h-72 w-full"
                src={youtubeEmbed}
                title={`${game.name} movie`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
