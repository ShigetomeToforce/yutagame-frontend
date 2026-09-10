import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface Banner {
  id: number;
  title: string;
  placement: string;
  imageKey: string;
  linkUrl: string;
  openInNewTab: boolean;
  startsAt?: string;
  endsAt?: string;
  displayOrder: number;
  clickCount: number;
  accessCount?: number;
}

const placements = [
  ["top_above", "TOP画面上"],
  ["top_below", "TOP画面下"],
  ["search_above", "ゲーム検索画面上"],
  ["search_below", "ゲーム検索画面下"],
  ["ranking_above", "ランキング画面上"],
  ["ranking_below", "ランキング画面下"],
  ["game_detail_below", "ゲーム詳細画面下"],
] as const;

export default function BannerManager() {
  const banners = useSignal<Banner[]>([]);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal("");
  const dragId = useSignal<number | null>(null);

  const load = async () => {
    loading.value = true;
    try {
      banners.value = await adminFetch<Banner[]>("/admin/banners");
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "読み込みに失敗しました。";
    } finally {
      loading.value = false;
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const reorder = async (placement: string, targetId: number) => {
    const movingId = dragId.value;
    if (movingId === null || movingId === targetId) return;
    const current = banners.value.filter((banner) =>
      banner.placement === placement
    );
    if (!current.some((banner) => banner.id === movingId)) return;
    const from = current.findIndex((banner) => banner.id === movingId);
    const to = current.findIndex((banner) => banner.id === targetId);
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    banners.value = banners.value.map((banner) => {
      const index = next.findIndex((item) => item.id === banner.id);
      return index < 0 ? banner : { ...banner, displayOrder: index + 1 };
    });
    saving.value = true;
    try {
      await adminFetch("/admin/banners/order", {
        method: "POST",
        body: JSON.stringify({
          placement,
          ids: next.map((banner) => banner.id),
        }),
      });
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "並び順の保存に失敗しました。";
      await load();
    } finally {
      saving.value = false;
      dragId.value = null;
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold tracking-[0.22em] text-emerald-600 uppercase">
            Banner management
          </p>
          <h1 class="mt-1 text-2xl font-black text-slate-800">バナー管理</h1>
        </div>
        <a
          href="/admin/banners/create"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          新規バナー登録
        </a>
      </div>
      {error.value && (
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </p>
      )}
      {saving.value && <p class="text-sm text-slate-500">並び順を保存中...</p>}
      {loading.value
        ? <p class="text-sm text-slate-500">読み込み中...</p>
        : placements.map(([placement, label]) => {
          const items = banners.value.filter((banner) =>
            banner.placement === placement
          ).sort((a, b) => a.displayOrder - b.displayOrder);
          return (
            <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header class="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h2 class="font-bold text-slate-800">{label}</h2>
              </header>
              {items.length === 0
                ? (
                  <p class="px-4 py-5 text-sm text-slate-500">
                    登録されているバナーはありません。
                  </p>
                )
                : (
                  <div>
                    {items.map((banner, index) => (
                      <a
                        href={`/admin/banners/${banner.id}`}
                        draggable
                        onDragStart={(event) => {
                          dragId.value = banner.id;
                          event.dataTransfer?.setData(
                            "text/plain",
                            String(banner.id),
                          );
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          void reorder(placement, banner.id);
                        }}
                        class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-sky-50"
                      >
                        <span class="w-7 shrink-0 text-center text-sm font-black text-slate-500">
                          {index + 1}
                        </span>
                        <img
                          src={buildImageUrl(banner.imageKey, "banners")}
                          alt=""
                          class="h-12 w-20 rounded object-cover ring-1 ring-slate-200"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="block truncate font-semibold text-slate-800">
                            {banner.title}
                          </span>
                          <span class="text-xs text-slate-500">
                            アクセス数:{" "}
                            {(banner.accessCount ?? 0).toLocaleString()}{" "}
                            / クリック数: {banner.clickCount.toLocaleString()}
                          </span>
                        </span>
                        <span class="text-slate-400">›</span>
                      </a>
                    ))}
                  </div>
                )}
            </section>
          );
        })}
    </div>
  );
}
