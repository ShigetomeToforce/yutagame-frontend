import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import type { GameRecommendationItem } from "../../../utils/appApi.ts";

export default function GameRecommendationForm(
  { recommendationId }: { recommendationId: number },
) {
  const item = useSignal<GameRecommendationItem | null>(null);
  const status = useSignal("NEW");
  const adminNote = useSignal("");
  const loading = useSignal(true);
  const submitting = useSignal(false);
  const error = useSignal("");
  useEffect(() => {
    void (async () => {
      try {
        const response = await adminFetch<GameRecommendationItem>(
          `/admin/game-recommendations/${recommendationId}`,
        );
        item.value = response;
        status.value = response.status;
        adminNote.value = response.adminNote || "";
      } catch (reason) {
        error.value = reason instanceof Error
          ? reason.message
          : "読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [recommendationId]);
  const save = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    try {
      await adminFetch(`/admin/game-recommendations/${recommendationId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status.value,
          adminNote: adminNote.value,
        }),
      });
      globalThis.location.href = "/admin/recommendations";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "保存に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };
  const remove = async () => {
    if (!globalThis.confirm("このおすすめゲームを削除しますか？")) return;
    try {
      await adminFetch(`/admin/game-recommendations/${recommendationId}`, {
        method: "DELETE",
      });
      globalThis.location.href = "/admin/recommendations";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "削除に失敗しました。";
    }
  };
  if (loading.value) return <p class="text-sm text-gray-500">読み込み中...</p>;
  if (!item.value) {
    return (
      <p class="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        おすすめゲームが見つかりません。
      </p>
    );
  }
  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
            おすすめゲーム管理
          </h1>
          <div class="flex items-center gap-3">
            <a
              href="/admin/recommendations"
              class="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="game-recommendation-form"
              disabled={submitting.value}
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting.value ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>
      <form
        id="game-recommendation-form"
        onSubmit={save}
        class="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            <span class="font-semibold">ゲーム名称:</span> {item.value.gameName}
          </p>
          <p>
            <span class="font-semibold">おすすめの理由:</span>
          </p>
          <div class="whitespace-pre-wrap rounded-md bg-white p-3">
            {item.value.reason}
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <select
            value={status.value}
            onChange={(event) =>
              status.value = (event.target as HTMLSelectElement).value}
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
          <textarea
            value={adminNote.value}
            onInput={(event) =>
              adminNote.value = (event.target as HTMLTextAreaElement).value}
            rows={6}
            placeholder="管理メモ"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        {error.value && (
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.value}
          </p>
        )}
        <div class="border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={remove}
            class="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            削除する
          </button>
        </div>
      </form>
    </div>
  );
}
