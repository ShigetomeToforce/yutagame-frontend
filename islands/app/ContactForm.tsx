import { useSignal } from "@preact/signals";
import { submitContactInquiry } from "../../utils/appApi.ts";

export default function ContactForm() {
  const name = useSignal("");
  const email = useSignal("");
  const subject = useSignal("");
  const message = useSignal("");
  const error = useSignal("");
  const success = useSignal("");
  const submitting = useSignal(false);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    success.value = "";
    try {
      await submitContactInquiry({
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value,
      });
      success.value = "お問い合わせを受け付けました。";
      name.value = "";
      email.value = "";
      subject.value = "";
      message.value = "";
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
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-cyan-100/80">
            ニックネーム（任意）
          </label>
          <input
            value={name.value}
            onInput={(e) => (name.value = (e.target as HTMLInputElement).value)}
            placeholder="例: よっしー"
            class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-semibold text-cyan-100/80">
            メールアドレス（返信希望時のみ・任意）
          </label>
          <input
            value={email.value}
            onInput={(
              e,
            ) => (email.value = (e.target as HTMLInputElement).value)}
            placeholder="example@example.com"
            class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
          />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-cyan-100/80">件名</label>
        <input
          value={subject.value}
          onInput={(
            e,
          ) => (subject.value = (e.target as HTMLInputElement).value)}
          placeholder="ご要望、掲載修正など"
          class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
        />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-cyan-100/80">
          お問い合わせ内容
        </label>
        <textarea
          value={message.value}
          onInput={(
            e,
          ) => (message.value = (e.target as HTMLTextAreaElement).value)}
          rows={8}
          placeholder="必要最小限の内容でご送信ください"
          class="w-full rounded-xl border border-cyan-200/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-50"
        />
      </div>
      <p class="text-xs text-cyan-100/70">
        送信は任意です。個人情報の入力は推奨していません。返信や対応の確約はできません。
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
        {submitting.value ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
