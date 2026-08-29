import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface GenreRecord {
  id: number;
  name: string;
  kana: string;
  overview: string;
  code: string;
  imageKey?: string | null;
}

interface GenreFormState {
  name: string;
  kana: string;
  overview: string;
  code: string;
}

const DEFAULT_FORM: GenreFormState = {
  name: "",
  kana: "",
  overview: "",
  code: "",
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface Props {
  mode: "create" | "edit";
  genreCode?: string;
}

export default function GenreForm({ mode, genreCode }: Props) {
  const form = useSignal<GenreFormState>({ ...DEFAULT_FORM });
  const genreId = useSignal<number | null>(null);
  const submitError = useSignal("");
  const isSubmitting = useSignal(false);
  const isLoading = useSignal(mode === "edit");
  const imageKey = useSignal<string | null>(null);
  const selectedImageFile = useSignal<File | null>(null);
  const previewImageUrl = useSignal<string | null>(null);

  useEffect(() => {
    if (mode !== "edit") {
      isLoading.value = false;
      return;
    }

    void (async () => {
      try {
        if (!genreCode) {
          throw new Error("ジャンルコードが指定されていません。");
        }

        const genre = await adminFetch<GenreRecord>(
          `/admin/genres/code/${encodeURIComponent(genreCode)}`,
        );
        genreId.value = genre.id;
        form.value = {
          name: genre.name ?? "",
          kana: genre.kana ?? "",
          overview: genre.overview ?? "",
          code: genre.code ?? "",
        };
        imageKey.value = genre.imageKey ?? null;
      } catch (error) {
        submitError.value = error instanceof Error
          ? error.message
          : "ジャンルの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [genreCode, mode]);

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

  const clearPreviewUrl = () => {
    if (previewImageUrl.value?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImageUrl.value);
    }
    previewImageUrl.value = null;
  };

  const handleSelectImage = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    selectedImageFile.value = file;
    clearPreviewUrl();
    if (file) {
      previewImageUrl.value = URL.createObjectURL(file);
    }
  };

  const uploadImageIfNeeded = async (id: number) => {
    if (!selectedImageFile.value) {
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImageFile.value);

    const response = await adminFetch<{ imageKey: string }>(
      `/admin/genres/${id}/image`,
      {
        method: "POST",
        body: formData,
      },
    );

    imageKey.value = response.imageKey;
    selectedImageFile.value = null;
    clearPreviewUrl();
  };

  const handleDeleteImage = async () => {
    if (!genreId.value) {
      return;
    }

    const confirmed = globalThis.confirm("登録されている画像を削除しますか？");
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/genres/${genreId.value}/image`, {
        method: "DELETE",
      });
      imageKey.value = null;
      selectedImageFile.value = null;
      clearPreviewUrl();
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "画像の削除に失敗しました。";
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      submitError.value = validationMessage;
      return;
    }

    if (mode === "edit" && genreId.value === null) {
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
        ? `/admin/genres/${genreId.value}`
        : "/admin/genres";
      const method = mode === "edit" ? "PUT" : "POST";

      const savedGenre = await adminFetch<GenreRecord>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      await uploadImageIfNeeded(savedGenre.id);

      globalThis.location.href = "/admin/genres";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "保存に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (genreId.value === null) return;

    const confirmed = globalThis.confirm(
      "このジャンルを削除してもよろしいですか？",
    );
    if (!confirmed) return;

    try {
      await adminFetch(`/admin/genres/${genreId.value}`, { method: "DELETE" });
      globalThis.location.href = "/admin/genres";
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
              {mode === "edit" ? "ジャンル編集" : "ジャンル新規登録"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/genres"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="genre-form"
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
        id="genre-form"
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
          {mode === "edit" && genreId.value !== null && (
            <div class="space-y-2 md:col-span-2">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-gray-700">ID</label>
                <input
                  type="text"
                  value={String(genreId.value)}
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

          <div class="space-y-2 md:col-span-1">
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
              class="min-h-[240px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-3 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              画像（任意）
            </label>
            <div class="flex min-h-[240px] items-start justify-start overflow-hidden">
              <img
                src={previewImageUrl.value ??
                  buildImageUrl(imageKey.value, "genres")}
                alt="ジャンル画像"
                class="max-h-[240px] w-auto object-contain"
              />
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSelectImage}
                class="block text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              {mode === "edit" && imageKey.value && (
                <button
                  type="button"
                  onClick={() => void handleDeleteImage()}
                  class="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  登録画像を解除
                </button>
              )}
            </div>
            {selectedImageFile.value && (
              <p class="text-xs text-gray-500">
                選択中:{" "}
                {selectedImageFile.value.name}（保存時にアップロードされます）
              </p>
            )}
          </div>

          <div class="space-y-2 md:col-span-1">
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
