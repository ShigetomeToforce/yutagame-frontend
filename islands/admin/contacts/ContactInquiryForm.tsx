import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface ContactInquiryRecord {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string;
}

interface Props {
  inquiryId: number;
}

export default function ContactInquiryForm({ inquiryId }: Props) {
  const item = useSignal<ContactInquiryRecord | null>(null);
  const status = useSignal("NEW");
  const adminNote = useSignal("");
  const loading = useSignal(true);
  const submitting = useSignal(false);
  const error = useSignal("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await adminFetch<ContactInquiryRecord>(
          `/admin/contacts/${inquiryId}`,
        );
        item.value = response;
        status.value = response.status || "NEW";
        adminNote.value = response.adminNote || "";
      } catch (err) {
        error.value = err instanceof Error
          ? err.message
          : "読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [inquiryId]);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    try {
      await adminFetch(`/admin/contacts/${inquiryId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status.value,
          adminNote: adminNote.value,
        }),
      });
      globalThis.location.href = "/admin/contacts";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "保存に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };

  if (loading.value) {
    return (
      <div class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        読み込み中...
      </div>
    );
  }

  if (!item.value) {
    return (
      <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        問い合わせが見つかりません。
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      class="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div class="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p>
          <span class="font-semibold">名前:</span> {item.value.name}
        </p>
        <p>
          <span class="font-semibold">メール:</span> {item.value.email}
        </p>
        <p>
          <span class="font-semibold">件名:</span> {item.value.subject}
        </p>
        <p>
          <span class="font-semibold">本文:</span>
        </p>
        <div class="whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-gray-700">
          {item.value.message}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <select
          value={status.value}
          onChange={(
            e,
          ) => (status.value = (e.target as HTMLSelectElement).value)}
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <textarea
          value={adminNote.value}
          onInput={(
            e,
          ) => (adminNote.value = (e.target as HTMLTextAreaElement).value)}
          rows={6}
          placeholder="管理メモ"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
        />
      </div>

      {error.value && (
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </div>
      )}

      <div class="flex gap-3">
        <button
          type="submit"
          disabled={submitting.value}
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting.value ? "保存中..." : "保存する"}
        </button>
        <a
          href="/admin/contacts"
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          一覧へ戻る
        </a>
      </div>
    </form>
  );
}
