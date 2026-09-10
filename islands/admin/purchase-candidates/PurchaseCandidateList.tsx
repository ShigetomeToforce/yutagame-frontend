import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface LinkedMaster {
  id: number;
  name: string;
  code: string;
}

interface PurchaseCandidate {
  id: number;
  name: string;
  kana: string;
  imageKey?: string | null;
  code: string;
  listPrice?: number | null;
  officialSiteUrl: string;
  youtubeUrl: string;
  releaseDateText: string;
  manufacturer?: LinkedMaster;
  machine?: LinkedMaster;
  genre?: LinkedMaster;
  isPurchased: boolean;
  displayOrder: number;
}

function formatPrice(value?: number | null): string {
  if (!value || value <= 0) return "-";
  return `${value.toLocaleString("ja-JP")}円`;
}

export default function PurchaseCandidateList() {
  const selectedTab = useSignal<"unpurchased" | "purchased">("unpurchased");
  const items = useSignal<PurchaseCandidate[]>([]);
  const loading = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal("");
  const dragId = useSignal<number | null>(null);

  const isPurchased = () => selectedTab.value === "purchased";

  const load = async () => {
    loading.value = true;
    error.value = "";
    try {
      items.value = await adminFetch<PurchaseCandidate[]>(
        `/admin/purchase-candidates?isPurchased=${isPurchased()}`,
      );
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "読み込みに失敗しました。";
      items.value = [];
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void load();
  }, [selectedTab.value]);

  const reorder = async (targetId: number) => {
    const movingId = dragId.value;
    dragId.value = null;
    if (movingId === null || movingId === targetId) return;
    const from = items.value.findIndex((item) => item.id === movingId);
    const to = items.value.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items.value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    items.value = next;

    saving.value = true;
    try {
      await adminFetch("/admin/purchase-candidates/order", {
        method: "POST",
        body: JSON.stringify({
          isPurchased: isPurchased(),
          ids: next.map((item) => item.id),
        }),
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

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
            Purchase candidates
          </p>
          <h1 class="mt-1 text-2xl font-black text-slate-800">購入候補管理</h1>
        </div>
        <a
          href="/admin/purchase-candidates/create"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          新規作成
        </a>
      </div>

      <div class="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            selectedTab.value = "unpurchased";
          }}
          class={`border-b-2 px-4 py-3 text-sm font-bold transition ${
            selectedTab.value === "unpurchased"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          未購入
        </button>
        <button
          type="button"
          onClick={() => {
            selectedTab.value = "purchased";
          }}
          class={`border-b-2 px-4 py-3 text-sm font-bold transition ${
            selectedTab.value === "purchased"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          購入済み
        </button>
      </div>

      {error.value && (
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </p>
      )}
      {saving.value && <p class="text-sm text-slate-500">並び順を保存中...</p>}
      {loading.value && <p class="text-sm text-slate-500">読み込み中...</p>}

      {!loading.value && items.value.length === 0 && (
        <p class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {selectedTab.value === "unpurchased"
            ? "未購入の候補はありません。"
            : "購入済みの候補はありません。"}
        </p>
      )}

      {!loading.value && items.value.length > 0 && (
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table class="min-w-full border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
                <th class="w-14 px-4 py-3 text-left">順</th>
                <th class="w-28 px-4 py-3 text-left">画像</th>
                <th class="px-4 py-3 text-left">名前</th>
                <th class="px-4 py-3 text-left">メーカー</th>
                <th class="px-4 py-3 text-left">機種</th>
                <th class="px-4 py-3 text-left">ジャンル</th>
                <th class="px-4 py-3 text-left">価格</th>
                <th class="px-4 py-3 text-left">リリース日</th>
                <th class="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.value.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => {
                    dragId.value = item.id;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => reorder(item.id)}
                  class="cursor-move border-b border-slate-100 last:border-b-0 hover:bg-sky-50/70"
                >
                  <td class="px-4 py-3 text-sm font-black text-slate-400">
                    {index + 1}
                  </td>
                  <td class="px-4 py-3">
                    <img
                      src={buildImageUrl(item.imageKey, "purchase-candidates")}
                      alt=""
                      class="h-14 w-20 rounded-md object-cover ring-1 ring-slate-200"
                    />
                  </td>
                  <td class="max-w-0 px-4 py-3">
                    <a
                      href={`/admin/purchase-candidates/${item.id}`}
                      class="block truncate font-semibold text-slate-900 hover:text-blue-700"
                      title={item.name}
                    >
                      {item.name}
                    </a>
                    <p
                      class="mt-1 truncate text-xs text-slate-500"
                      title={item.code}
                    >
                      {item.code} / {item.kana}
                    </p>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">
                    {item.manufacturer?.name || "-"}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">
                    {item.machine?.name || "-"}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">
                    {item.genre?.name || "-"}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">
                    {formatPrice(item.listPrice)}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">
                    {item.releaseDateText || "-"}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-400">drag</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
