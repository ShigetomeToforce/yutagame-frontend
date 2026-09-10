import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface AnnouncementRecord {
  id: number;
  title: string;
  excerpt: string;
  bodyHtml: string;
  status: string;
  publishStartAt?: string | null;
  publishEndAt?: string | null;
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
  publishStartAt: "",
  publishEndAt: "",
};

// APIのISO日時文字列を<input type="datetime-local">向けの yyyy-MM-ddTHH:mm に変換する
const toDateTimeInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${
    pad(date.getDate())
  }T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// 見出しやリストが管理画面上でも視覚的に区別できるようTailwindの任意バリアントでスタイルを当てる
const RICH_TEXT_STYLE_CLASSES = [
  "[&_h1]:text-3xl",
  "[&_h1]:font-black",
  "[&_h1]:mt-4",
  "[&_h1]:mb-2",
  "[&_h2]:text-2xl",
  "[&_h2]:font-bold",
  "[&_h2]:mt-4",
  "[&_h2]:mb-2",
  "[&_h3]:text-xl",
  "[&_h3]:font-bold",
  "[&_h3]:mt-3",
  "[&_h3]:mb-2",
  "[&_h4]:text-lg",
  "[&_h4]:font-bold",
  "[&_h4]:mt-3",
  "[&_h4]:mb-1",
  "[&_p]:my-2",
  "[&_ul]:my-2",
  "[&_ul]:list-disc",
  "[&_ul]:pl-6",
  "[&_ol]:my-2",
  "[&_ol]:list-decimal",
  "[&_ol]:pl-6",
  "[&_a]:text-blue-600",
  "[&_a]:underline",
  "[&_img]:max-w-full",
  "[&_img]:h-auto",
  "[&_img]:rounded-md",
  "[&_img]:my-2",
  "[&_blockquote]:border-l-4",
  "[&_blockquote]:border-gray-300",
  "[&_blockquote]:pl-3",
  "[&_blockquote]:text-gray-600",
].join(" ");

type ToolbarButton = {
  label: string;
  title: string;
  onClick: () => void;
};

export default function AnnouncementForm(
  { mode = "create", announcementId }: Props,
) {
  const form = useSignal({ ...EMPTY });
  const loading = useSignal(mode === "edit");
  const submitting = useSignal(false);
  const uploadingImage = useSignal(false);
  const error = useSignal("");
  const previewHtml = useSignal(EMPTY.bodyHtml);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const editorInitialized = useSignal(false);

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
          publishStartAt: toDateTimeInputValue(item.publishStartAt),
          publishEndAt: toDateTimeInputValue(item.publishEndAt),
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

  // contentEditable の中身はDOM側の状態なので、初回描画時にのみ流し込む
  useEffect(() => {
    if (!loading.value && editorRef.current && !editorInitialized.value) {
      editorRef.current.innerHTML = form.value.bodyHtml;
      editorInitialized.value = true;
    }
  }, [loading.value]);

  const updateField = <K extends keyof typeof EMPTY>(
    key: K,
    value: (typeof EMPTY)[K],
  ) => {
    form.value = { ...form.value, [key]: value };
  };

  const syncBodyFromEditor = () => {
    const html = editorRef.current?.innerHTML ?? "";
    form.value = { ...form.value, bodyHtml: html };
    previewHtml.value = html;
  };

  const saveSelection = () => {
    const selection = globalThis.getSelection?.();
    if (
      selection && selection.rangeCount > 0 && editorRef.current &&
      editorRef.current.contains(selection.anchorNode)
    ) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const range = savedRangeRef.current;
    const selection = globalThis.getSelection?.();
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncBodyFromEditor();
  };

  const styleInsertedImages = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("img:not([data-styled])").forEach((img) => {
      img.setAttribute("data-styled", "true");
      img.classList.add("max-w-full", "h-auto", "rounded-md", "my-2");
    });
  };

  const uploadContentImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await adminFetch<{ imageKey: string }>(
      "/admin/announcements/upload-image",
      {
        method: "POST",
        body: formData,
      },
    );
    return buildImageUrl(response.imageKey, "announcements");
  };

  const insertImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      error.value = "画像ファイルを選択してください。";
      return;
    }
    uploadingImage.value = true;
    error.value = "";
    try {
      const url = await uploadContentImage(file);
      restoreSelection();
      document.execCommand("insertImage", false, url);
      styleInsertedImages();
      syncBodyFromEditor();
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : "画像のアップロードに失敗しました。";
    } finally {
      uploadingImage.value = false;
    }
  };

  const handleImageButtonClick = () => {
    saveSelection();
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    await insertImageFile(file);
  };

  const caretRangeFromPoint = (x: number, y: number): Range | null => {
    const docAny = document as unknown as {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null;
    };
    if (docAny.caretRangeFromPoint) {
      return docAny.caretRangeFromPoint(x, y);
    }
    if (docAny.caretPositionFromPoint) {
      const pos = docAny.caretPositionFromPoint(x, y);
      if (!pos) return null;
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
    return null;
  };

  const handleEditorDrop = async (event: DragEvent) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    event.preventDefault();
    const range = caretRangeFromPoint(event.clientX, event.clientY);
    if (range) {
      savedRangeRef.current = range;
    }
    await insertImageFile(file);
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
        publishStartAt: form.value.publishStartAt,
        publishEndAt: form.value.publishEndAt,
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

  const toolbarButtonClass =
    "rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100";

  const headingButtons: ToolbarButton[] = [
    {
      label: "本文",
      title: "本文（段落）",
      onClick: () => exec("formatBlock", "<p>"),
    },
    {
      label: "H1",
      title: "見出し1",
      onClick: () => exec("formatBlock", "<h1>"),
    },
    {
      label: "H2",
      title: "見出し2",
      onClick: () => exec("formatBlock", "<h2>"),
    },
    {
      label: "H3",
      title: "見出し3",
      onClick: () => exec("formatBlock", "<h3>"),
    },
    {
      label: "H4",
      title: "見出し4",
      onClick: () => exec("formatBlock", "<h4>"),
    },
  ];

  const inlineButtons: ToolbarButton[] = [
    { label: "B", title: "太字", onClick: () => exec("bold") },
    { label: "U", title: "下線", onClick: () => exec("underline") },
    { label: "S", title: "打ち消し線", onClick: () => exec("strikeThrough") },
  ];

  const listButtons: ToolbarButton[] = [
    {
      label: "箇条書き",
      title: "箇条書き",
      onClick: () => exec("insertUnorderedList"),
    },
    {
      label: "箇条書き（数字）",
      title: "番号付き箇条書き",
      onClick: () => exec("insertOrderedList"),
    },
  ];

  const alignButtons: ToolbarButton[] = [
    { label: "左寄せ", title: "左寄せ", onClick: () => exec("justifyLeft") },
    {
      label: "中央寄せ",
      title: "中央寄せ",
      onClick: () => exec("justifyCenter"),
    },
    { label: "右寄せ", title: "右寄せ", onClick: () => exec("justifyRight") },
  ];

  const indentButtons: ToolbarButton[] = [
    {
      label: "インデント+",
      title: "インデントを増やす",
      onClick: () => exec("indent"),
    },
    {
      label: "インデント-",
      title: "インデントを減らす",
      onClick: () => exec("outdent"),
    },
  ];

  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
            お知らせ管理
          </h1>
          <div class="flex items-center gap-3">
            <a
              href="/admin/announcements"
              class="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="announcement-form"
              disabled={submitting.value}
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting.value ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>
      <form
        id="announcement-form"
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

          <div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <div class="flex flex-wrap gap-1.5">
              {headingButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={btn.onClick}
                  class={toolbarButtonClass}
                >
                  {btn.label}
                </button>
              ))}
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              {inlineButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={btn.onClick}
                  class={toolbarButtonClass}
                >
                  {btn.label}
                </button>
              ))}
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              <label
                title="文字色"
                class="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700"
              >
                文字色
                <input
                  type="color"
                  class="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  onMouseDown={saveSelection}
                  onInput={(e) => {
                    restoreSelection();
                    exec("foreColor", (e.target as HTMLInputElement).value);
                  }}
                />
              </label>
              <label
                title="文字背景"
                class="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700"
              >
                文字背景
                <input
                  type="color"
                  class="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  onMouseDown={saveSelection}
                  onInput={(e) => {
                    restoreSelection();
                    exec("hiliteColor", (e.target as HTMLInputElement).value);
                  }}
                />
              </label>
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              {listButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={btn.onClick}
                  class={toolbarButtonClass}
                >
                  {btn.label}
                </button>
              ))}
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              {alignButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={btn.onClick}
                  class={toolbarButtonClass}
                >
                  {btn.label}
                </button>
              ))}
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              {indentButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={btn.onClick}
                  class={toolbarButtonClass}
                >
                  {btn.label}
                </button>
              ))}
              <span class="mx-1 w-px self-stretch bg-gray-300" />
              <button
                type="button"
                title="リンク"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = globalThis.prompt(
                    "リンク先URLを入力してください",
                  );
                  if (url) exec("createLink", url);
                }}
                class={toolbarButtonClass}
              >
                リンク
              </button>
              <button
                type="button"
                title="画像を挿入（本文中にドラッグ＆ドロップでも挿入できます）"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleImageButtonClick}
                disabled={uploadingImage.value}
                class={`${toolbarButtonClass} disabled:opacity-60`}
              >
                {uploadingImage.value ? "アップロード中..." : "画像"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                class="hidden"
                onChange={handleImageFileChange}
              />
            </div>
            <p class="text-xs text-gray-400">
              画像は本文エリアへドラッグ＆ドロップして挿入することもできます。
            </p>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={syncBodyFromEditor}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onDrop={handleEditorDrop}
            onDragOver={(e) => e.preventDefault()}
            class={`min-h-[320px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${RICH_TEXT_STYLE_CLASSES}`}
          />

          <div class="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <p class="mb-1 text-xs font-semibold text-gray-500">公開状態</p>
              <div class="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
                <button
                  type="button"
                  onClick={() => updateField("status", "DRAFT")}
                  class={`w-20 py-2 text-center text-sm font-semibold transition ${
                    form.value.status === "DRAFT"
                      ? "bg-gray-700 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  下書き
                </button>
                <button
                  type="button"
                  onClick={() => updateField("status", "PUBLISHED")}
                  class={`w-20 py-2 text-center text-sm font-semibold transition ${
                    form.value.status === "PUBLISHED"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  公開
                </button>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">
                公開開始日時
              </label>
              <input
                type="datetime-local"
                value={form.value.publishStartAt}
                onInput={(e) =>
                  updateField(
                    "publishStartAt",
                    (e.target as HTMLInputElement).value,
                  )}
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">
                公開終了日時
              </label>
              <input
                type="datetime-local"
                value={form.value.publishEndAt}
                onInput={(e) =>
                  updateField(
                    "publishEndAt",
                    (e.target as HTMLInputElement).value,
                  )}
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <p class="basis-full text-xs text-gray-400">
              公開開始日時・公開終了日時を指定すると、その期間内のみ公開ページに表示されます（未指定の項目は制限なしとして扱われます）。
            </p>
          </div>

          <div class="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-xs font-semibold text-emerald-700">
                プレビュー（作成中のお知らせ）
              </p>
              <span
                class={`rounded-full px-3 py-1 text-xs font-bold ${
                  form.value.status === "PUBLISHED"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {form.value.status === "PUBLISHED" ? "公開" : "下書き"}
              </span>
            </div>
            <div class="public-scope rounded-xl border border-gray-200 bg-white p-6">
              <h2 class="text-xl font-bold text-gray-900">
                {form.value.title || "（タイトル未入力）"}
              </h2>
              <div
                class={`mt-4 max-w-none text-sm ${RICH_TEXT_STYLE_CLASSES}`}
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
      </form>
    </div>
  );
}
