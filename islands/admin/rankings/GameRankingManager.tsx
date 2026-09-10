import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

type RankingItem = {
  gameId: number;
  rank: number;
  code: string;
  name: string;
  kana: string;
  imageKey?: string | null;
  price: number;
  releaseDate: string;
  manufacturerName: string;
  machineName: string;
  genreName: string;
};

type RankingResponse = {
  currentMode: "draft" | "active";
  current: RankingItem[];
  draft: RankingItem[] | null;
  active: RankingItem[] | null;
};

export default function GameRankingManager() {
  const items = useSignal<RankingItem[]>([]);
  const loading = useSignal(false);
  const saving = useSignal(false);
  const publishing = useSignal(false);
  const dragIndex = useSignal<number | null>(null);

  const loadRanking = async () => {
    loading.value = true;
    try {
      const response = await adminFetch<RankingResponse>("/admin/rankings");
      items.value = response.current ?? [];
    } catch (error) {
      console.error(error);
      items.value = [];
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void loadRanking();
  }, []);

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    items.value = next;
  };

  const handleSaveDraft = async () => {
    saving.value = true;
    try {
      await adminFetch("/admin/rankings/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameIds: items.value.map((item) => item.gameId),
        }),
      });
      await loadRanking();
    } finally {
      saving.value = false;
    }
  };

  const handlePublish = async () => {
    publishing.value = true;
    try {
      await adminFetch("/admin/rankings/publish", {
        method: "POST",
      });
      await loadRanking();
    } finally {
      publishing.value = false;
    }
  };

  const formatPrice = (price: number) => {
    if (!Number.isFinite(price) || price === 0) return "¥0";
    return `¥${price.toLocaleString("ja-JP")}`;
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold tracking-[0.22em] text-emerald-600 uppercase">
            Ranking management
          </p>
          <h1 class="mt-1 text-2xl font-black text-slate-800">
            ランキング管理
          </h1>
        </div>

        <div class="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving.value || loading.value}
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving.value ? "一時保存中..." : "一時保存"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing.value || loading.value}
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing.value ? "公開中..." : "順位を保存"}
          </button>
        </div>
      </div>

      {loading.value && (
        <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          ランキングを読み込み中です...
        </div>
      )}

      {!loading.value && items.value.length === 0 && (
        <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          登録済みのゲームがありません。
        </div>
      )}

      {!loading.value && items.value.length > 0 && (
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-[72rem] w-full table-fixed border-collapse text-left text-sm">
              <thead class="bg-slate-100 text-slate-700">
                <tr>
                  <th class="w-16 px-3 py-3 font-semibold">順位</th>
                  <th class="w-24 px-3 py-3 font-semibold">サムネイル</th>
                  <th class="w-64 px-3 py-3 font-semibold">タイトル</th>
                  <th class="w-40 px-3 py-3 font-semibold">メーカー</th>
                  <th class="w-40 px-3 py-3 font-semibold">機種</th>
                  <th class="w-40 px-3 py-3 font-semibold">ジャンル</th>
                  <th class="w-32 px-3 py-3 font-semibold">リリース日</th>
                  <th class="w-28 px-3 py-3 font-semibold">価格</th>
                </tr>
              </thead>
              <tbody>
                {items.value.map((item, index) => (
                  <tr
                    key={item.gameId}
                    draggable
                    onDragStart={() => {
                      dragIndex.value = index;
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={() => {
                      if (dragIndex.value === null) return;
                      reorderItems(dragIndex.value, index);
                      dragIndex.value = null;
                    }}
                    class="border-t border-slate-200 transition hover:bg-sky-50/60"
                  >
                    <td class="px-3 py-3 align-middle font-black text-slate-800">
                      {index + 1}
                    </td>
                    <td class="px-3 py-3 align-middle">
                      <img
                        src={buildImageUrl(item.imageKey, "games")}
                        alt={item.name}
                        class="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    </td>
                    <td class="px-3 py-3 align-middle">
                      <div class="font-semibold text-slate-800">
                        <span class="block truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div class="text-xs text-slate-500">
                        <span class="block truncate" title={item.kana}>
                          {item.kana}
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-3 align-middle text-slate-700">
                      <span
                        class="block truncate"
                        title={item.manufacturerName || "-"}
                      >
                        {item.manufacturerName || "-"}
                      </span>
                    </td>
                    <td class="px-3 py-3 align-middle text-slate-700">
                      <span
                        class="block truncate"
                        title={item.machineName || "-"}
                      >
                        {item.machineName || "-"}
                      </span>
                    </td>
                    <td class="px-3 py-3 align-middle text-slate-700">
                      <span
                        class="block truncate"
                        title={item.genreName || "-"}
                      >
                        {item.genreName || "-"}
                      </span>
                    </td>
                    <td class="px-3 py-3 align-middle text-slate-700">
                      <span
                        class="block truncate"
                        title={item.releaseDate || "-"}
                      >
                        {item.releaseDate || "-"}
                      </span>
                    </td>
                    <td class="px-3 py-3 align-middle font-semibold text-slate-800">
                      {formatPrice(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
