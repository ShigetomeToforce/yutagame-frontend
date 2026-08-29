import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface ManufacturerRecord {
  id: number;
  name: string;
  kana: string;
  overview: string;
  code: string;
}

interface ManufacturerFormState {
  name: string;
  kana: string;
  overview: string;
  code: string;
}

const DEFAULT_FORM: ManufacturerFormState = {
  name: "",
  kana: "",
  overview: "",
  code: "",
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface Props {
  mode: "create" | "edit";
  manufacturerCode?: string;
}

export default function ManufacturerForm({ mode, manufacturerCode }: Props) {
  const form = useSignal<ManufacturerFormState>({ ...DEFAULT_FORM });
  const manufacturerId = useSignal<number | null>(null);
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
        if (!manufacturerCode) {
          throw new Error("メーカーコードが指定されていません。");
        }

        const manufacturer = await adminFetch<ManufacturerRecord>(
          `/admin/manufacturers/code/${encodeURIComponent(manufacturerCode)}`,
        );

        manufacturerId.value = manufacturer.id;
        form.value = {
          name: manufacturer.name ?? "",
          kana: manufacturer.kana ?? "",
          overview: manufacturer.overview ?? "",
          code: manufacturer.code ?? "",
        };
      } catch (error) {
        submitError.value = error instanceof Error
          ? error.message
          : "メーカーの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [manufacturerCode, mode]);

  const validateForm = () => {
    if (!form.value.name.trim()) return "名前は必須です。";
    if (!form.value.kana.trim()) return "カナは必須です。";
    if (!form.value.overview.trim()) return "概要は必須です。";
    if (!form.value.code.trim()) return "コードは必須です。";
    if (!CODE_PATTERN.test(form.value.code.trim())) {
      return "コードは半角英数字・ハイフン・アンダーバーのみで入力してください。";
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

    if (mode === "edit" && manufacturerId.value === null) {
      submitError.value = "更新対象のIDが取得できません。";
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
      };

      const endpoint = mode === "edit"
        ? `/admin/manufacturers/${manufacturerId.value}`
        : "/admin/manufacturers";
      const method = mode === "edit" ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      globalThis.location.href = "/admin/manufacturers";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "保存に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (manufacturerId.value === null) return;

    const confirmed = globalThis.confirm(
      "このメーカーを削除してもよろしいですか？",
    );
    if (!confirmed) return;

    try {
      await adminFetch(`/admin/manufacturers/${manufacturerId.value}`, {
        method: "DELETE",
      });
      globalThis.location.href = "/admin/manufacturers";
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
            <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
              {mode === "edit" ? "メーカー編集" : "メーカー新規登録"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/manufacturers"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="manufacturer-form"
              disabled={isSubmitting.value || isLoading.value}
              class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting.value
                ? "保存中..."
                : mode === "edit"
                ? "更新する"
                : "登録する"}
            </button>
          </div>
        </div>
      </div>

      <form
        id="manufacturer-form"
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
          {mode === "edit" && manufacturerId.value !== null && (
            <div class="space-y-2 md:col-span-2">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-gray-700">ID</label>
                <input
                  type="text"
                  value={String(manufacturerId.value)}
                  readOnly
                  class="w-24 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 sm:w-32"
                />
              </div>
            </div>
          )}

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              名前<span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.name}
              maxLength={100}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                name: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              カナ<span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.kana}
              maxLength={100}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                kana: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">
              概要<span class="ml-1 text-red-500">*</span>
            </label>
            <textarea
              value={form.value.overview}
              rows={8}
              maxLength={1000}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                overview: (e.target as HTMLTextAreaElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              コード<span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.code}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                code: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {mode === "edit" && (
          <div class="flex justify-end border-t border-gray-200 pt-12">
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
