import { useComputed, useSignal } from "@preact/signals";
import type { AnnouncementItem } from "../../utils/appApi.ts";

const PAGE_SIZE = 10;

function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
}

export default function AnnouncementList(
  { items }: { items: AnnouncementItem[] },
) {
  const visibleCount = useSignal(PAGE_SIZE);
  const visibleItems = useComputed(() => items.slice(0, visibleCount.value));
  const hasMore = useComputed(() => visibleCount.value < items.length);

  if (items.length === 0) {
    return (
      <p class="text-sm text-cyan-100/80">
        まだお知らせはありません。
      </p>
    );
  }

  return (
    <div class="space-y-4">
      <div class="space-y-4">
        {visibleItems.value.map((item) => (
          <a
            href={`/announcements/${item.id}`}
            class="block rounded-2xl border border-cyan-300/20 bg-black/15 p-4 transition hover:border-cyan-200/45 hover:bg-black/25"
          >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-lg font-bold text-white">{item.title}</h2>
              <span class="text-xs text-cyan-100/70">
                {formatDate(item.publishedAt || item.createdAt)}
              </span>
            </div>
            <p class="mt-2 text-sm text-cyan-50/85">{item.excerpt}</p>
          </a>
        ))}
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
