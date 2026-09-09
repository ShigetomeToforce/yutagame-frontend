import { useEffect } from "preact/hooks";
import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface AnnouncementRecord {
  id: number;
  title: string;
  excerpt: string;
  bodyHtml: string;
  status: string;
}

interface Props {
  mode?: "create" | "edit";
  announcementId?: number;
}

const EMPTY = {
  title: "",
  excerpt: "",
  bodyHtml: "<p>ここに本文を入力します。</p>",
  status: "DRAFT",
};

export default function AnnouncementForm(
  { mode = "create", announcementId }: Props,
) {
  const form = useSignal({ ...EMPTY });
  const loading = useSignal(mode === "edit");
  const submitting = useSignal(false);
  const error = useSignal("");
  const previewHtml = useSignal(EMPTY.bodyHtml);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !announcementId) {
      loading.value = false;
      return;
    }
    void (async () => {
      try {
        const item = await adminFetch<AnnouncementRecord>(
          `/admin/announcements/${announcementId}`,
        );
        form.value = {
          title: item.title ?? "",
          excerpt: item.excerpt ?? "",
          bodyHtml: item.bodyHtml ?? "",
          status: item.status ?? "DRAFT",
        };
        previewHtml.value = item.bodyHtml ?? "";
      } catch (err) {
        error.value = err instanceof Error
          ? err.message
          : "読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [announcementId, mode]);

  const updateField = <K extends keyof typeof EMPTY>(
    key: K,
    value: (typeof EMPTY)[K],
  ) => {
    form.value = { ...form.value, [key]: value };
    if (key === "bodyHtml") {
      previewHtml.value = String(value);
    }
  };

  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const current = form.value.bodyHtml;
    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    updateField("bodyHtml", next);
    queueMicrotask(() => {
      textarea.focus();
      const caret = start + snippet.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    try {
      const payload = {
        title: form.value.title,
        excerpt: form.value.excerpt,
        bodyHtml: form.value.bodyHtml,
        status: form.value.status,
      };
      if (mode === "edit" && announcementId) {
        await adminFetch(`/admin/announcements/${announcementId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/admin/announcements", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      globalThis.location.href = "/admin/announcements";
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

  return (
    <form
      onSubmit={onSubmit}
      class="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div class="grid gap-4">
        <input
          value={form.value.title}
          onInput={(e) =>
            updateField("title", (e.target as HTMLInputElement).value)}
          placeholder="タイトル"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={form.value.excerpt}
          onInput={(e) =>
            updateField("excerpt", (e.target as HTMLTextAreaElement).value)}
          placeholder="概要（空欄なら本文から自動生成）"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          rows={3}
        />
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertSnippet("<h2></h2>")}
            class="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("<p></p>")}
            class="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("<strong></strong>")}
            class="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs"
          >
            Strong
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('<a href=""></a>')}
            class="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs"
          >
            Link
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={form.value.bodyHtml}
          onInput={(e) =>
            updateField("bodyHtml", (e.target as HTMLTextAreaElement).value)}
          placeholder="HTML本文"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          rows={14}
        />
        <div class="grid gap-4 lg:grid-cols-2">
          <select
            value={form.value.status}
            onChange={(e) =>
              updateField("status", (e.target as HTMLSelectElement).value)}
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p class="mb-2 text-xs font-semibold text-gray-500">プレビュー</p>
            <div
              class="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml.value }}
            />
          </div>
        </div>
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
          href="/admin/announcements"
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          一覧へ戻る
        </a>
      </div>
    </form>
  );
}
