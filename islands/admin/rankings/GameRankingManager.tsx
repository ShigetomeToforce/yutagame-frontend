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
  draft: RankingItem[];
  active: RankingItem[];
};

export default function GameRankingManager() {
  const activeItems = useSignal<RankingItem[]>([]);
  const draftItems = useSignal<RankingItem[]>([]);
  const selectedTab = useSignal<"active" | "draft">("active");
  const loading = useSignal(false);
  const saving = useSignal(false);
  const publishing = useSignal(false);
  const discarding = useSignal(false);
  const errorMessage = useSignal("");
  const dragIndex = useSignal<number | null>(null);

  const loadRanking = async () => {
    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await adminFetch<RankingResponse>("/admin/rankings");
      activeItems.value = response.active ?? [];
      draftItems.value = response.draft ?? [];
    } catch (error) {
      console.error(error);
      activeItems.value = [];
      draftItems.value = [];
      errorMessage.value = "ランキング情報の取得に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void loadRanking();
  }, []);

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...draftItems.value];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    draftItems.value = next;
  };

  const saveDraftOrder = async () => {
    await adminFetch("/admin/rankings/draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameIds: draftItems.value.map((item) => item.gameId),
      }),
    });
  };

  const handleSaveDraft = async () => {
    saving.value = true;
    errorMessage.value = "";
    try {
      await saveDraftOrder();
      await loadRanking();
      selectedTab.value = "draft";
    } catch (error) {
      console.error(error);
      errorMessage.value = "一時保存に失敗しました。";
    } finally {
      saving.value = false;
    }
  };

  const handlePublish = async () => {
    publishing.value = true;
    errorMessage.value = "";
    try {
      await saveDraftOrder();
      await adminFetch("/admin/rankings/publish", {
        method: "POST",
      });
      await loadRanking();
      selectedTab.value = "active";
    } catch (error) {
      console.error(error);
      errorMessage.value = "公開保存に失敗しました。";
    } finally {
      publishing.value = false;
    }
  };

  const handleDiscardDraft = async () => {
    discarding.value = true;
    try {
      await adminFetch("/admin/rankings/draft", {
        method: "DELETE",
      });
      await loadRanking();
      selectedTab.value = "active";
    } finally {
      discarding.value = false;
    }
  };

  const formatPrice = (price: number) => {
    if (!Number.isFinite(price) || price === 0) return "¥0";
    return `¥${price.toLocaleString("ja-JP")}`;
  };

  const startDraftFromActive = async () => {
    selectedTab.value = "draft";
    loading.value = true;
    errorMessage.value = "";
    try {
      const items = await adminFetch<RankingItem[]>(
        "/admin/rankings/edit-order",
      );
      draftItems.value = items ?? [];
    } catch (error) {
      console.error(error);
      draftItems.value = [];
      errorMessage.value = "編集用ランキングの取得に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  const isDraftView = selectedTab.value === "draft";
  const items = isDraftView ? draftItems.value : activeItems.value;

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

        {isDraftView && draftItems.value.length > 0 && (
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleDiscardDraft}
              disabled={discarding.value || saving.value || publishing.value ||
                loading.value}
              class="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {discarding.value ? "破棄中..." : "一時保存を破棄"}
            </button>
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
              {publishing.value ? "公開中..." : "保存して公開"}
            </button>
          </div>
        )}
        {!isDraftView && draftItems.value.length === 0 && (
          <button
            type="button"
            onClick={startDraftFromActive}
            disabled={saving.value || loading.value}
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ランキングを編集
          </button>
        )}
      </div>

      <div class="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            selectedTab.value = "active";
          }}
          class={`border-b-2 px-4 py-3 text-sm font-bold transition ${
            !isDraftView
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          現在のランキング
        </button>
        <button
          type="button"
          onClick={() => {
            selectedTab.value = "draft";
          }}
          class={`border-b-2 px-4 py-3 text-sm font-bold transition ${
            isDraftView
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          一時保存中のランキング
        </button>
      </div>

      {loading.value && (
        <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          ランキングを読み込み中です...
        </div>
      )}

      {errorMessage.value && (
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage.value}
        </div>
      )}

      {!loading.value && !errorMessage.value && items.length === 0 &&
        isDraftView && (
        <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          <p>一時保存中のランキングはありません。</p>
          <button
            type="button"
            onClick={startDraftFromActive}
            disabled={saving.value || loading.value}
            class="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ランキングを編集
          </button>
        </div>
      )}

      {!loading.value && !errorMessage.value && items.length === 0 &&
        !isDraftView && (
        <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          <p>現在公開中のランキングはありません。</p>
        </div>
      )}

      {!loading.value && items.length > 0 && (
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
                {items.map((item, index) => (
                  <tr
                    key={item.gameId}
                    draggable={isDraftView}
                    onDragStart={() => {
                      if (!isDraftView) return;
                      dragIndex.value = index;
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={() => {
                      if (!isDraftView) {
                        return;
                      }
                      if (dragIndex.value === null) {
                        return;
                      }
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
