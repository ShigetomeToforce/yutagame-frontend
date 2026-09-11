// deno-lint-ignore-file react-no-danger
// 編集中の特集HTMLをプレビューする管理画面です。
import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";
import type { FeatureItem, GameItem } from "../../../utils/appApi.ts";
import type { PaginatedResponse } from "../common/PaginatedResourceTable.tsx";

type Props = {
  mode?: "create" | "edit";
  featureId?: number;
};

type MasterItem = { id: number; name: string };

const EMPTY = {
  code: "",
  title: "",
  excerpt: "",
  bodyHtml: "<p>ここに本文を入力します。</p>",
  thumbnailImageKey: "",
  status: "DRAFT",
  publishStartAt: "",
  publishEndAt: "",
};

const EMPTY_FILTERS = {
  q: "",
  genreId: "",
  machineId: "",
  manufacturerId: "",
  releaseYear: "",
  releaseMonth: "",
  releaseDay: "",
};

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
].join(" ");

const toDateTimeInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${
    pad(date.getDate())
  }T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatReleaseDate = (value?: string): string => {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
};

export default function FeatureForm({ mode = "create", featureId }: Props) {
  const form = useSignal({ ...EMPTY });
  const filters = useSignal({ ...EMPTY_FILTERS });
  const selectedGames = useSignal<GameItem[]>([]);
  const searchResults = useSignal<GameItem[]>([]);
  const genres = useSignal<MasterItem[]>([]);
  const machines = useSignal<MasterItem[]>([]);
  const manufacturers = useSignal<MasterItem[]>([]);
  const loading = useSignal(mode === "edit");
  const searching = useSignal(false);
  const submitting = useSignal(false);
  const uploadingImage = useSignal(false);
  const error = useSignal("");
  const previewHtml = useSignal(EMPTY.bodyHtml);
  const selectedThumbnailUrl = useSignal("");
  const thumbnailFile = useSignal<File | null>(null);
  const editorInitialized = useSignal(false);
  const dragGameId = useSignal<number | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [genreItems, machineItems, manufacturerItems] = await Promise.all(
          [
            adminFetch<MasterItem[]>("/admin/genres"),
            adminFetch<MasterItem[]>("/admin/machines"),
            adminFetch<MasterItem[]>("/admin/manufacturers"),
          ],
        );
        genres.value = genreItems;
        machines.value = machineItems;
        manufacturers.value = manufacturerItems;
      } catch (reason) {
        error.value = reason instanceof Error
          ? reason.message
          : "マスターデータの読み込みに失敗しました。";
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !featureId) {
      loading.value = false;
      return;
    }
    void (async () => {
      try {
        const item = await adminFetch<FeatureItem>(
          `/admin/features/${featureId}`,
        );
        form.value = {
          code: item.code ?? "",
          title: item.title ?? "",
          excerpt: item.excerpt ?? "",
          bodyHtml: item.bodyHtml ?? "",
          thumbnailImageKey: item.thumbnailImageKey ?? "",
          status: item.status ?? "DRAFT",
          publishStartAt: toDateTimeInputValue(item.publishStartAt),
          publishEndAt: toDateTimeInputValue(item.publishEndAt),
        };
        selectedGames.value = item.games ?? [];
        previewHtml.value = item.bodyHtml ?? "";
      } catch (reason) {
        error.value = reason instanceof Error
          ? reason.message
          : "読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [featureId, mode]);

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

  const updateFilter = <K extends keyof typeof EMPTY_FILTERS>(
    key: K,
    value: (typeof EMPTY_FILTERS)[K],
  ) => {
    filters.value = { ...filters.value, [key]: value };
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
    const selection = globalThis.getSelection?.();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };

  const exec = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    syncBodyFromEditor();
  };

  const uploadContentImage = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("image", file);
    const response = await adminFetch<{ imageKey: string }>(
      "/admin/features/upload-image",
      { method: "POST", body },
    );
    return buildImageUrl(response.imageKey, "features");
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
      syncBodyFromEditor();
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "画像のアップロードに失敗しました。";
    } finally {
      uploadingImage.value = false;
    }
  };

  const handleSearch = async () => {
    searching.value = true;
    error.value = "";
    try {
      const query = new URLSearchParams({ page: "1", limit: "50" });
      if (filters.value.q) query.set("q", filters.value.q);
      if (filters.value.genreId) {
        query.append("genreIDs", filters.value.genreId);
      }
      if (filters.value.machineId) {
        query.append("machineIDs", filters.value.machineId);
      }
      if (filters.value.manufacturerId) {
        query.append("manufacturerIDs", filters.value.manufacturerId);
      }
      if (filters.value.releaseYear) {
        query.set("releaseYear", filters.value.releaseYear);
      }
      if (filters.value.releaseMonth) {
        query.set("releaseMonth", filters.value.releaseMonth);
      }
      if (filters.value.releaseDay) {
        query.set("releaseDay", filters.value.releaseDay);
      }
      const response = await adminFetch<PaginatedResponse<GameItem>>(
        `/admin/games?${query.toString()}`,
      );
      searchResults.value = response.data ?? [];
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "ゲーム検索に失敗しました。";
    } finally {
      searching.value = false;
    }
  };

  const addGame = (game: GameItem) => {
    if (selectedGames.value.some((item) => item.id === game.id)) return;
    selectedGames.value = [...selectedGames.value, game];
  };

  const removeGame = (gameId: number) => {
    selectedGames.value = selectedGames.value.filter((item) =>
      item.id !== gameId
    );
  };

  const reorderSelectedGame = (targetId: number) => {
    const movingId = dragGameId.value;
    dragGameId.value = null;
    if (movingId === null || movingId === targetId) return;
    const from = selectedGames.value.findIndex((item) => item.id === movingId);
    const to = selectedGames.value.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...selectedGames.value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    selectedGames.value = next;
  };

  const onThumbnailChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      error.value = "画像ファイルを選択してください。";
      return;
    }
    if (selectedThumbnailUrl.value) {
      URL.revokeObjectURL(selectedThumbnailUrl.value);
    }
    thumbnailFile.value = file;
    selectedThumbnailUrl.value = URL.createObjectURL(file);
  };

  useEffect(() => () => {
    if (selectedThumbnailUrl.value) {
      URL.revokeObjectURL(selectedThumbnailUrl.value);
    }
  }, []);

  const uploadThumbnail = async (id: number, file: File) => {
    const body = new FormData();
    body.append("image", file);
    await adminFetch(`/admin/features/${id}/thumbnail-image`, {
      method: "POST",
      body,
    });
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    syncBodyFromEditor();
    submitting.value = true;
    error.value = "";
    try {
      const payload = {
        ...form.value,
        gameIds: selectedGames.value.map((game) => game.id),
      };
      const saved = mode === "edit" && featureId
        ? await adminFetch<FeatureItem>(`/admin/features/${featureId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        : await adminFetch<FeatureItem>("/admin/features", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      if (thumbnailFile.value) {
        await uploadThumbnail(saved.id, thumbnailFile.value);
      }
      globalThis.location.href = "/admin/features";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "保存に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };

  const toolbarButtonClass =
    "rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100";

  if (loading.value) {
    return (
      <div class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        読み込み中...
      </div>
    );
  }

  return (
    <div class="mx-auto max-w-6xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">特集管理</h1>
          <div class="flex items-center gap-3">
            <a
              href="/admin/features"
              class="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="feature-form"
              disabled={submitting.value}
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting.value ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>

      <form
        id="feature-form"
        onSubmit={onSubmit}
        class="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-4">
            <input
              value={form.value.title}
              onInput={(e) =>
                updateField("title", (e.target as HTMLInputElement).value)}
              placeholder="タイトル"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={form.value.code}
              onInput={(e) =>
                updateField("code", (e.target as HTMLInputElement).value)}
              placeholder="コード（例: 2026_30th）"
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
                {[
                  ["本文", "formatBlock", "<p>"],
                  ["H1", "formatBlock", "<h1>"],
                  ["H2", "formatBlock", "<h2>"],
                  ["H3", "formatBlock", "<h3>"],
                  ["H4", "formatBlock", "<h4>"],
                ].map(([label, command, value]) => (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec(command, value)}
                    class={toolbarButtonClass}
                  >
                    {label}
                  </button>
                ))}
                <span class="mx-1 w-px self-stretch bg-gray-300" />
                {[
                  ["B", "bold"],
                  ["U", "underline"],
                  ["S", "strikeThrough"],
                  ["箇条書き", "insertUnorderedList"],
                  ["番号", "insertOrderedList"],
                  ["左", "justifyLeft"],
                  ["中央", "justifyCenter"],
                  ["右", "justifyRight"],
                  ["インデント+", "indent"],
                  ["インデント-", "outdent"],
                ].map(([label, command]) => (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec(command)}
                    class={toolbarButtonClass}
                  >
                    {label}
                  </button>
                ))}
                <label class="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                  文字色
                  <input
                    type="color"
                    class="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                    onMouseDown={saveSelection}
                    onInput={(e) =>
                      exec("foreColor", (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                  背景
                  <input
                    type="color"
                    class="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                    onMouseDown={saveSelection}
                    onInput={(e) =>
                      exec("hiliteColor", (e.target as HTMLInputElement).value)}
                  />
                </label>
                <button
                  type="button"
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => imageInputRef.current?.click()}
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
                  onChange={async (event) => {
                    const input = event.target as HTMLInputElement;
                    const file = input.files?.[0];
                    input.value = "";
                    if (file) await insertImageFile(file);
                  }}
                />
              </div>
            </div>

            <div
              ref={editorRef}
              contentEditable
              onInput={syncBodyFromEditor}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              onDrop={async (event) => {
                const file = event.dataTransfer?.files?.[0];
                if (!file) return;
                event.preventDefault();
                await insertImageFile(file);
              }}
              onDragOver={(e) => e.preventDefault()}
              class={`min-h-[320px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${RICH_TEXT_STYLE_CLASSES}`}
            />
          </div>

          <aside class="space-y-4">
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p class="mb-2 text-xs font-semibold text-gray-500">
                サムネイル画像
              </p>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                onChange={onThumbnailChange}
              />
              {(form.value.thumbnailImageKey || selectedThumbnailUrl.value) && (
                <div class="mt-3 grid gap-3">
                  {form.value.thumbnailImageKey && (
                    <section>
                      <p class="mb-2 text-sm font-semibold text-slate-700">
                        現在のサムネイル
                      </p>
                      <img
                        src={buildImageUrl(
                          form.value.thumbnailImageKey,
                          "features",
                        )}
                        alt="現在のサムネイル"
                        class="max-h-48 w-full rounded-lg object-contain ring-1 ring-slate-200"
                      />
                    </section>
                  )}
                  {selectedThumbnailUrl.value && (
                    <section>
                      <p class="mb-2 text-sm font-semibold text-slate-700">
                        アップロード予定の画像
                      </p>
                      <img
                        src={selectedThumbnailUrl.value}
                        alt="アップロード予定のサムネイル"
                        class="max-h-48 w-full rounded-lg object-contain ring-2 ring-emerald-400"
                      />
                    </section>
                  )}
                </div>
              )}
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p class="mb-1 text-xs font-semibold text-gray-500">公開状態</p>
              <div class="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white">
                <button
                  type="button"
                  onClick={() => updateField("status", "DRAFT")}
                  class={`w-20 py-2 text-sm font-semibold ${
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
                  class={`w-20 py-2 text-sm font-semibold ${
                    form.value.status === "PUBLISHED"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  公開
                </button>
              </div>
              <label class="mt-4 block text-xs font-semibold text-gray-500">
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
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <label class="mt-4 block text-xs font-semibold text-gray-500">
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
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </aside>
        </div>

        <section class="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <input
              value={filters.value.q}
              onInput={(e) =>
                updateFilter("q", (e.target as HTMLInputElement).value)}
              placeholder="ゲーム名で検索"
              class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm lg:min-w-[220px] lg:flex-[1_1_260px]"
            />
            <select
              value={filters.value.genreId}
              onInput={(e) =>
                updateFilter("genreId", (e.target as HTMLSelectElement).value)}
              class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm lg:min-w-[150px] lg:flex-[1_1_170px]"
            >
              <option value="">ジャンル</option>
              {genres.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              value={filters.value.machineId}
              onInput={(e) =>
                updateFilter(
                  "machineId",
                  (e.target as HTMLSelectElement).value,
                )}
              class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm lg:min-w-[150px] lg:flex-[1_1_170px]"
            >
              <option value="">機種</option>
              {machines.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              value={filters.value.manufacturerId}
              onInput={(e) =>
                updateFilter(
                  "manufacturerId",
                  (e.target as HTMLSelectElement).value,
                )}
              class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm lg:min-w-[180px] lg:flex-[1_1_220px]"
            >
              <option value="">メーカー</option>
              {manufacturers.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
            <div class="grid min-w-0 grid-cols-3 gap-2 lg:flex-[0_0_320px]">
              <input
                type="number"
                min="1"
                max="9999"
                inputMode="numeric"
                value={filters.value.releaseYear}
                onInput={(e) =>
                  updateFilter(
                    "releaseYear",
                    (e.target as HTMLInputElement).value,
                  )}
                placeholder="発売年"
                class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                max="12"
                inputMode="numeric"
                value={filters.value.releaseMonth}
                onInput={(e) =>
                  updateFilter(
                    "releaseMonth",
                    (e.target as HTMLInputElement).value,
                  )}
                placeholder="発売月"
                class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                max="31"
                inputMode="numeric"
                value={filters.value.releaseDay}
                onInput={(e) =>
                  updateFilter(
                    "releaseDay",
                    (e.target as HTMLInputElement).value,
                  )}
                placeholder="発売日"
                class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching.value}
              class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60 lg:min-w-[88px] lg:flex-none"
            >
              {searching.value ? "検索中..." : "検索"}
            </button>
          </div>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div class="rounded-lg border border-gray-200 bg-white">
              <div class="border-b border-gray-200 px-3 py-2 text-sm font-bold text-gray-700">
                検索結果
              </div>
              <div class="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {searchResults.value.length === 0
                  ? (
                    <p class="p-3 text-sm text-gray-500">
                      条件を指定して検索してください。
                    </p>
                  )
                  : searchResults.value.map((game) => (
                    <button
                      type="button"
                      onClick={() => addGame(game)}
                      class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sky-50"
                    >
                      <img
                        src={buildImageUrl(game.imageKey, "games")}
                        alt=""
                        class="h-12 w-12 rounded object-cover"
                      />
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-gray-800">
                          {game.name}
                        </span>
                        <span class="text-xs text-gray-500">
                          {game.genre?.name || "-"} /{" "}
                          {game.machine?.name || "-"} /{" "}
                          {game.manufacturer?.name || "-"} /{" "}
                          {formatReleaseDate(game.releaseDate)}
                        </span>
                      </span>
                      <span class="text-sm font-bold text-blue-600">追加</span>
                    </button>
                  ))}
              </div>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white">
              <div class="border-b border-gray-200 px-3 py-2 text-sm font-bold text-gray-700">
                選択中のゲーム（{selectedGames.value.length}件）
              </div>
              <div class="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {selectedGames.value.length === 0
                  ? (
                    <p class="p-3 text-sm text-gray-500">
                      紹介するゲームを選択してください。
                    </p>
                  )
                  : selectedGames.value.map((game, index) => (
                    <div
                      draggable
                      onDragStart={() => {
                        dragGameId.value = game.id;
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderSelectedGame(game.id)}
                      class="flex cursor-move items-center gap-3 px-3 py-2 hover:bg-sky-50"
                    >
                      <span class="w-6 text-center text-xs font-black text-gray-400">
                        {index + 1}
                      </span>
                      <img
                        src={buildImageUrl(game.imageKey, "games")}
                        alt=""
                        class="h-12 w-12 rounded object-cover"
                      />
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-gray-800">
                          {game.name}
                        </span>
                        <span class="text-xs text-gray-500">
                          {game.genre?.name || "-"} /{" "}
                          {game.machine?.name || "-"}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGame(game.id)}
                        class="text-sm font-bold text-red-600"
                      >
                        削除
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <div class="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold text-emerald-700">
              プレビュー（作成中の特集）
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
            <img
              src={selectedThumbnailUrl.value ||
                buildImageUrl(form.value.thumbnailImageKey, "features")}
              alt=""
              class="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
            />
            <p class="text-xs font-bold tracking-[0.18em] text-cyan-700">
              {form.value.code || "FEATURE_CODE"}
            </p>
            <h2 class="mt-2 text-xl font-bold text-gray-900">
              {form.value.title || "（タイトル未入力）"}
            </h2>
            <p class="mt-2 text-sm text-gray-600">{form.value.excerpt}</p>
            <div
              class={`mt-4 max-w-none text-sm ${RICH_TEXT_STYLE_CLASSES}`}
              dangerouslySetInnerHTML={{ __html: previewHtml.value }}
            />
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
