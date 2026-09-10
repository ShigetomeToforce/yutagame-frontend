import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import type { AnnouncementItem } from "../../../utils/appApi.ts";

export default function AnnouncementPublishOrder() {
  const items = useSignal<AnnouncementItem[]>([]);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const error = useSignal("");
  const dragId = useSignal<number | null>(null);

  const load = async () => {
    loading.value = true;
    try {
      items.value = await adminFetch<AnnouncementItem[]>(
        "/admin/announcements/published-order",
      );
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

  const reorder = async (targetId: number) => {
    const movingId = dragId.value;
    dragId.value = null;
    if (movingId === null || movingId === targetId) return;
    const current = items.value;
    const from = current.findIndex((item) => item.id === movingId);
    const to = current.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    items.value = next;

    saving.value = true;
    try {
      await adminFetch("/admin/announcements/order", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "並び順の保存に失敗しました。";
      await load();
    } finally {
      saving.value = false;
    }
  };

  if (loading.value) {
    return (
      <p class="text-sm text-slate-500">公開中のお知らせを読み込み中...</p>
    );
  }

  if (items.value.length === 0) {
    return null;
  }

  return (
    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header class="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 class="font-bold text-slate-800">公開中のお知らせの表示順</h2>
        <p class="mt-1 text-xs text-slate-500">
          ドラッグ＆ドロップで並び替えると、アプリケーション側の表示順（優先度）に反映されます。
        </p>
      </header>
      {error.value && (
        <p class="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error.value}
        </p>
      )}
      {saving.value && (
        <p class="border-b border-slate-200 px-4 py-2 text-sm text-slate-500">
          並び順を保存中...
        </p>
      )}
      <div>
        {items.value.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => {
              dragId.value = item.id;
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => reorder(item.id)}
            class="flex cursor-move items-center gap-3 border-t border-slate-200 px-4 py-3 first:border-t-0 hover:bg-sky-50/60"
          >
            <span class="w-8 text-center font-black text-slate-400">
              {index + 1}
            </span>
            <span class="flex-1 truncate font-medium text-slate-800">
              {item.title}
            </span>
            <span class="text-xs text-slate-400">⠿</span>
          </div>
        ))}
      </div>
    </section>
  );
}
