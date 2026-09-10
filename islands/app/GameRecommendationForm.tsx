import { useSignal } from "@preact/signals";
import { submitGameRecommendation } from "../../utils/appApi.ts";

export default function GameRecommendationForm() {
  const gameName = useSignal("");
  const reason = useSignal("");
  const error = useSignal("");
  const success = useSignal("");
  const submitting = useSignal(false);
  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    success.value = "";
    try {
      await submitGameRecommendation({
        gameName: gameName.value,
        reason: reason.value,
      });
      gameName.value = "";
      reason.value = "";
      success.value = "おすすめゲームを受け付けました。";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "送信に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };
  return (
    <form
      onSubmit={onSubmit}
      class="space-y-4 rounded-2xl border border-cyan-300/20 bg-black/15 p-4"
    >
      <div class="space-y-1">
        <label class="text-xs font-semibold text-cyan-100/80">ゲーム名称</label>
        <input
          required
          value={gameName.value}
          onInput={(event) =>
            gameName.value = (event.target as HTMLInputElement).value}
          placeholder="例: ○○○"
          class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
        />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-cyan-100/80">
          おすすめの理由
        </label>
        <textarea
          required
          value={reason.value}
          onInput={(event) =>
            reason.value = (event.target as HTMLTextAreaElement).value}
          rows={8}
          placeholder="おすすめしたい理由を教えてください"
          class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
        />
      </div>
      <p class="text-xs text-cyan-100/70">
        個人情報の入力は推奨していません。送信内容はサイト運営の参考として確認しますが、掲載や対応をお約束するものではありません。
      </p>
      {error.value && (
        <p class="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error.value}
        </p>
      )}
      {success.value && (
        <p class="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {success.value}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting.value}
        class="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
      >
        {submitting.value ? "送信中..." : "おすすめを送信"}
      </button>
    </form>
  );
}
