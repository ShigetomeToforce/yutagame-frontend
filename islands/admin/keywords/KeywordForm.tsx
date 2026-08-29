import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface KeywordRecord {
  id: number;
  name: string;
  kana: string;
  overview: string;
  code: string;
  keywordType: string;
  sortOrder: number;
}

interface KeywordFormState {
  name: string;
  kana: string;
  overview: string;
  code: string;
  keywordType: string;
  sortOrder: string;
}

const DEFAULT_FORM: KeywordFormState = {
  name: "",
  kana: "",
  overview: "",
  code: "",
  keywordType: "SERIES",
  sortOrder: "0",
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface Props {
  mode: "create" | "edit";
  keywordId?: number;
  keywordCode?: string;
}

export default function KeywordForm({ mode, keywordId, keywordCode }: Props) {
  const form = useSignal<KeywordFormState>({ ...DEFAULT_FORM });
  const currentKeywordId = useSignal<number | null>(keywordId ?? null);
  const submitError = useSignal("");
  const isSubmitting = useSignal(false);
  const isLoading = useSignal(mode === "edit");

  useEffect(() => {
    if (mode !== "edit") {
      isLoading.value = false;
      return;
    }

    void (async () => {
      try {
        const endpoint = keywordCode
          ? `/admin/keywords/code/${encodeURIComponent(keywordCode)}`
          : keywordId
          ? `/admin/keywords/${keywordId}`
          : "";

        if (!endpoint) {
          throw new Error("キーワードの識別子が指定されていません。");
        }

        const keyword = await adminFetch<KeywordRecord>(endpoint);
        currentKeywordId.value = keyword.id;
        form.value = {
          name: keyword.name ?? "",
          kana: keyword.kana ?? "",
          overview: keyword.overview ?? "",
          code: keyword.code ?? "",
          keywordType: keyword.keywordType ?? "SERIES",
          sortOrder: String(keyword.sortOrder ?? 0),
        };
      } catch (error) {
        submitError.value = error instanceof Error
          ? error.message
          : "キーワードの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [keywordId, keywordCode, mode]);

  const validateForm = () => {
    if (!form.value.name.trim()) {
      return "名前は必須です。";
    }
    if (form.value.name.length > 100) {
      return "名前は100文字以内で入力してください。";
    }
    if (!form.value.kana.trim()) {
      return "カナは必須です。";
    }
    if (form.value.kana.length > 100) {
      return "カナは100文字以内で入力してください。";
    }
    if (form.value.overview.length > 1000) {
      return "概要は1000文字以内で入力してください。";
    }
    if (!form.value.code.trim()) {
      return "コードは必須です。";
    }
    if (!CODE_PATTERN.test(form.value.code.trim())) {
      return "コードは半角英数字・ハイフン・アンダーバーのみで入力してください。";
    }
    if (!form.value.keywordType) {
      return "種別は必須です。";
    }
    if (
      form.value.sortOrder.trim() && !/^\d+$/.test(form.value.sortOrder.trim())
    ) {
      return "並び順は数値で入力してください。";
    }
    return "";
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      submitError.value = validationMessage;
      return;
    }

    isSubmitting.value = true;
    submitError.value = "";

    try {
      const payload = {
        name: form.value.name.trim(),
        kana: form.value.kana.trim(),
        overview: form.value.overview.trim(),
        code: form.value.code.trim(),
        keywordType: form.value.keywordType,
        sortOrder: Number(form.value.sortOrder || 0),
      };

      const endpoint = mode === "edit" && currentKeywordId.value
        ? `/admin/keywords/${currentKeywordId.value}`
        : "/admin/keywords";
      const method = mode === "edit" ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      globalThis.location.href = "/admin/keywords";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "保存に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (!currentKeywordId.value) {
      return;
    }
    const confirmed = globalThis.confirm(
      "このキーワードを削除してもよろしいですか？",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/keywords/${currentKeywordId.value}`, {
        method: "DELETE",
      });
      globalThis.location.href = "/admin/keywords";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "削除に失敗しました。";
    }
  };

  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div class="flex min-w-0 items-center gap-3">
            {mode === "edit" && currentKeywordId.value !== null && (
              <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <div class="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  ID
                </div>
                <div class="font-mono text-sm font-bold text-gray-800">
                  {currentKeywordId.value}
                </div>
              </div>
            )}
            <div>
              <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
                {mode === "edit" ? "キーワード編集" : "キーワード新規登録"}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/keywords"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="keyword-form"
              disabled={isSubmitting.value || isLoading.value}
              class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting.value
                ? "保存中..."
                : (mode === "edit" ? "更新する" : "登録する")}
            </button>
          </div>
        </div>
      </div>

      <form
        id="keyword-form"
        onSubmit={handleSubmit}
        class="space-y-8 p-4 sm:p-6"
      >
        {isLoading.value && (
          <div class="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            読み込み中です...
          </div>
        )}

        {submitError.value && (
          <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError.value}
          </div>
        )}

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              名前
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.name}
              maxLength={100}
              onInput={(event) => {
                form.value = {
                  ...form.value,
                  name: (event.target as HTMLInputElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              カナ
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.kana}
              maxLength={100}
              onInput={(event) => {
                form.value = {
                  ...form.value,
                  kana: (event.target as HTMLInputElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">
              概要
            </label>
            <textarea
              value={form.value.overview}
              maxLength={1000}
              rows={4}
              onInput={(event) => {
                form.value = {
                  ...form.value,
                  overview: (event.target as HTMLTextAreaElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              コード
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.code}
              onInput={(event) => {
                form.value = {
                  ...form.value,
                  code: (event.target as HTMLInputElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              種別
              <span class="ml-1 text-red-500">*</span>
            </label>
            <select
              value={form.value.keywordType}
              onChange={(event) => {
                form.value = {
                  ...form.value,
                  keywordType: (event.target as HTMLSelectElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="SERIES">SERIES</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="MACHINE">MACHINE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              並び順
            </label>
            <input
              type="number"
              min={0}
              value={form.value.sortOrder}
              onInput={(event) => {
                form.value = {
                  ...form.value,
                  sortOrder: (event.target as HTMLInputElement).value,
                };
              }}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {mode === "edit" && (
          <div class="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleDelete}
              class="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
            >
              削除
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
