import { useComputed, useSignal } from "@preact/signals";
import type { FeatureItem } from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";

const PAGE_SIZE = 10;

function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
}

function toIntroText(html: string, fallback: string): string {
  const source = html || fallback;
  return source.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(
    /\s+/g,
    " ",
  ).trim();
}

export default function FeatureList({ items }: { items: FeatureItem[] }) {
  const visibleCount = useSignal(PAGE_SIZE);
  const visibleItems = useComputed(() => items.slice(0, visibleCount.value));
  const hasMore = useComputed(() => visibleCount.value < items.length);

  if (items.length === 0) {
    return (
      <p class="text-sm text-cyan-100/80">
        公開中の特集はまだありません。
      </p>
    );
  }

  return (
    <div class="space-y-5">
      <div class="grid gap-4 lg:grid-cols-2">
        {visibleItems.value.map((item) => {
          const intro = toIntroText(item.bodyHtml, item.excerpt);
          return (
            <a
              href={`/features/${item.code}`}
              class="group grid overflow-hidden rounded-2xl border border-cyan-300/20 bg-black/15 transition hover:border-cyan-200/45 hover:bg-black/25 sm:grid-cols-[180px_minmax(0,1fr)]"
            >
              <div class="relative aspect-[16/9] overflow-hidden bg-slate-950 sm:aspect-auto sm:min-h-40">
                <img
                  src={buildImageUrl(item.thumbnailImageKey, "features")}
                  alt=""
                  class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div class="min-w-0 p-4">
                <div class="flex flex-wrap items-center gap-2 text-xs text-cyan-100/70">
                  <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                </div>
                <h2 class="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white">
                  {item.title}
                </h2>
                <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-cyan-50/80">
                  {intro || item.excerpt}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {hasMore.value && (
        <div class="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              visibleCount.value = Math.min(
                visibleCount.value + PAGE_SIZE,
                items.length,
              );
            }}
            class="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400"
          >
            View More
          </button>
        </div>
      )}
    </div>
  );
}
