import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface OptionItem {
  id: number;
  name: string;
}

interface GameRecord {
  id: number;
  name: string;
  kana: string;
  overview: string;
  code: string;
  manufacturerId: number;
  machineId: number;
  genreId: number;
  subGenre: string;
  catchCopy: string;
  subCatch: string;
  listPrice: number;
  releaseDate: string;
  officialSiteUrl: string;
  youtubeUrl: string;
  isPlay: boolean;
  isClear: boolean;
  isFavourite: boolean;
  keywords?: Array<{ id: number }>;
}

interface GameFormState {
  name: string;
  kana: string;
  overview: string;
  code: string;
  manufacturerId: number | null;
  machineId: number | null;
  genreId: number | null;
  subGenre: string;
  catchCopy: string;
  subCatch: string;
  listPrice: string;
  releaseDate: string;
  officialSiteUrl: string;
  youtubeUrl: string;
  isPlay: boolean | null;
  isClear: boolean | null;
  isFavourite: boolean | null;
}

const EMPTY_FORM: GameFormState = {
  name: "",
  kana: "",
  overview: "",
  code: "",
  manufacturerId: null,
  machineId: null,
  genreId: null,
  subGenre: "",
  catchCopy: "",
  subCatch: "",
  listPrice: "",
  releaseDate: "",
  officialSiteUrl: "",
  youtubeUrl: "",
  isPlay: null,
  isClear: null,
  isFavourite: null,
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface Props {
  mode?: "create" | "edit";
  gameCode?: string;
}

export default function GameForm({ mode = "create", gameCode }: Props) {
  const gameId = useSignal<number | null>(null);
  const manufacturers = useSignal<OptionItem[]>([]);
  const machines = useSignal<OptionItem[]>([]);
  const genres = useSignal<OptionItem[]>([]);
  const keywords = useSignal<OptionItem[]>([]);

  const manufacturerSearchQuery = useSignal("");
  const machineSearchQuery = useSignal("");
  const genreSearchQuery = useSignal("");
  const keywordSearchQuery = useSignal("");

  const manufacturerModalOpen = useSignal(false);
  const machineModalOpen = useSignal(false);
  const genreModalOpen = useSignal(false);
  const keywordModalOpen = useSignal(false);

  const selectedKeywordIds = useSignal<number[]>([]);
  const form = useSignal<GameFormState>({ ...EMPTY_FORM });
  const submitError = useSignal("");
  const isSubmitting = useSignal(false);
  const isLoading = useSignal(mode === "edit");

  useEffect(() => {
    void (async () => {
      try {
        const [
          manufacturerResponse,
          machineResponse,
          genreResponse,
          keywordResponse,
        ] = await Promise.all([
          adminFetch<OptionItem[]>("/admin/manufacturers"),
          adminFetch<OptionItem[]>("/admin/machines"),
          adminFetch<OptionItem[]>("/admin/genres"),
          adminFetch<OptionItem[]>("/admin/keywords"),
        ]);

        manufacturers.value = manufacturerResponse ?? [];
        machines.value = machineResponse ?? [];
        genres.value = genreResponse ?? [];
        keywords.value = keywordResponse ?? [];

        if (mode === "edit") {
          if (!gameCode) {
            throw new Error("ゲームコードが指定されていません。");
          }

          const game = await adminFetch<GameRecord>(
            `/admin/games/code/${encodeURIComponent(gameCode)}`,
          );
          gameId.value = game.id;
          form.value = {
            name: game.name ?? "",
            kana: game.kana ?? "",
            overview: game.overview ?? "",
            code: game.code ?? "",
            manufacturerId: game.manufacturerId ?? null,
            machineId: game.machineId ?? null,
            genreId: game.genreId ?? null,
            subGenre: game.subGenre ?? "",
            catchCopy: game.catchCopy ?? "",
            subCatch: game.subCatch ?? "",
            listPrice: String(game.listPrice ?? 0),
            releaseDate: (game.releaseDate ?? "").split("T")[0] ?? "",
            officialSiteUrl: game.officialSiteUrl ?? "",
            youtubeUrl: game.youtubeUrl ?? "",
            isPlay: game.isPlay,
            isClear: game.isClear,
            isFavourite: game.isFavourite,
          };
          selectedKeywordIds.value = (game.keywords ?? []).map((keyword) =>
            keyword.id
          );
        }
      } catch {
        manufacturers.value = [];
        machines.value = [];
        genres.value = [];
        keywords.value = [];
        submitError.value = "データの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [gameCode, mode]);

  const updateField = <K extends keyof GameFormState>(
    key: K,
    value: GameFormState[K],
  ) => {
    form.value = { ...form.value, [key]: value };
  };

  const validateForm = () => {
    if (!form.value.name.trim()) {
      return "名前は必須です。";
    }
    if (!form.value.kana.trim()) {
      return "カナは必須です。";
    }
    if (form.value.name.length > 100) {
      return "名前は100文字以内で入力してください。";
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
    if (form.value.manufacturerId === null) {
      return "メーカーを選択してください。";
    }
    if (form.value.machineId === null) {
      return "機種を選択してください。";
    }
    if (form.value.genreId === null) {
      return "ジャンルを選択してください。";
    }
    if (form.value.subGenre.length > 100) {
      return "サブジャンルは100文字以内で入力してください。";
    }
    if (form.value.catchCopy.length > 100) {
      return "キャッチコピーは100文字以内で入力してください。";
    }
    if (form.value.subCatch.length > 200) {
      return "サブキャッチは200文字以内で入力してください。";
    }
    if (
      form.value.listPrice.trim() && !/^\d+$/.test(form.value.listPrice.trim())
    ) {
      return "価格は数値のみ入力してください。";
    }
    if (!form.value.releaseDate) {
      return "リリース日は必須です。";
    }
    if (form.value.officialSiteUrl && !isValidUrl(form.value.officialSiteUrl)) {
      return "公式URLの形式が正しくありません。";
    }
    if (form.value.youtubeUrl && !isValidUrl(form.value.youtubeUrl)) {
      return "YoutubeURLの形式が正しくありません。";
    }
    if (form.value.isPlay === null) {
      return "プレイ済みは必須です。";
    }
    if (form.value.isClear === null) {
      return "クリア済みは必須です。";
    }
    if (form.value.isFavourite === null) {
      return "お気に入りは必須です。";
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
        manufacturerId: Number(form.value.manufacturerId),
        machineId: Number(form.value.machineId),
        genreId: Number(form.value.genreId),
        subGenre: form.value.subGenre.trim(),
        catchCopy: form.value.catchCopy.trim(),
        subCatch: form.value.subCatch.trim(),
        listPrice: form.value.listPrice.trim()
          ? Number(form.value.listPrice.trim())
          : 0,
        releaseDate: form.value.releaseDate,
        officialSiteUrl: form.value.officialSiteUrl.trim(),
        youtubeUrl: form.value.youtubeUrl.trim(),
        isPlay: form.value.isPlay,
        isClear: form.value.isClear,
        isFavourite: form.value.isFavourite,
        keywordIds: selectedKeywordIds.value,
      };

      if (mode === "edit" && gameId.value === null) {
        throw new Error("更新対象のIDが取得できません。");
      }

      const endpoint = mode === "edit"
        ? `/admin/games/${gameId.value}`
        : "/admin/games";
      const method = mode === "edit" ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      globalThis.location.href = "/admin/games";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "登録に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (gameId.value === null) {
      return;
    }

    const confirmed = globalThis.confirm(
      "このゲームを削除してもよろしいですか？",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/games/${gameId.value}`, { method: "DELETE" });
      globalThis.location.href = "/admin/games";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "削除に失敗しました。";
    }
  };

  const renderSingleSelectField = (
    label: string,
    required: boolean,
    options: OptionItem[],
    selectedId: number | null,
    modalOpen: { value: boolean },
    searchQuery: { value: string },
    setSelectedId: (id: number | null) => void,
    modalTitle: string,
  ) => {
    const selectedOption = options.find((option) => option.id === selectedId) ??
      null;
    const filteredOptions = options.filter((option) => {
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return true;
      return option.name.toLowerCase().includes(q);
    });

    return (
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span class="ml-1 text-red-500">*</span> : null}
        </label>

        <div class="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
          <button
            type="button"
            onClick={() => (modalOpen.value = true)}
            class="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <span>{selectedOption ? "変更する" : "選択する"}</span>
            <span class="text-base">＋</span>
          </button>

          {selectedOption
            ? (
              <span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                <span
                  class="max-w-[12rem] truncate"
                  title={selectedOption.name}
                >
                  {selectedOption.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-300"
                  aria-label={`${selectedOption.name} を選択解除`}
                >
                  ×
                </button>
              </span>
            )
            : <span class="text-sm text-gray-500">未選択</span>}
        </div>

        {modalOpen.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => (modalOpen.value = false)}
          >
            <div
              class="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 class="text-base font-semibold text-gray-900">
                  {modalTitle}
                </h3>
                <button
                  type="button"
                  class="text-gray-500 hover:text-gray-700"
                  onClick={() => (modalOpen.value = false)}
                >
                  ✕
                </button>
              </div>

              <div class="space-y-4 p-4">
                <input
                  type="text"
                  value={searchQuery.value}
                  onInput={(event) => {
                    searchQuery.value =
                      (event.target as HTMLInputElement).value;
                  }}
                  placeholder="名前で検索"
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div class="max-h-72 space-y-2 overflow-y-auto rounded border border-gray-200 p-2">
                  {filteredOptions.length > 0
                    ? filteredOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(option.id);
                          modalOpen.value = false;
                          searchQuery.value = "";
                        }}
                        class={selectedId === option.id
                          ? "flex w-full items-center justify-between rounded border border-blue-500 bg-blue-50 px-3 py-2 text-left text-sm font-medium text-blue-700"
                          : "flex w-full items-center justify-between rounded border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"}
                      >
                        <span>{option.name}</span>
                        <span>{selectedId === option.id ? "✓" : ""}</span>
                      </button>
                    ))
                    : (
                      <p class="px-2 py-4 text-center text-sm text-gray-500">
                        一致する項目がありません。
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMultiSelectField = (
    label: string,
    options: OptionItem[],
    selectedIds: number[],
    modalOpen: { value: boolean },
    searchQuery: { value: string },
    toggleSelected: (id: number) => void,
  ) => {
    const filteredOptions = options.filter((option) => {
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return true;
      return option.name.toLowerCase().includes(q);
    });

    return (
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">{label}</label>

        <div class="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
          <button
            type="button"
            onClick={() => (modalOpen.value = true)}
            class="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <span>選択する</span>
            <span class="text-base">＋</span>
          </button>

          {selectedIds.length > 0 && (
            <div class="flex flex-wrap items-center gap-2">
              {(() => {
                const visible = selectedIds.slice(0, 5);
                const remaining = selectedIds.length - visible.length;
                return (
                  <>
                    {visible.map((id) => {
                      const option = options.find((o) => o.id === id);
                      if (!option) {
                        return null;
                      }
                      return (
                        <span
                          key={option.id}
                          class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          <span
                            class="max-w-[10rem] truncate"
                            title={option.name}
                          >
                            {option.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSelected(option.id)}
                            class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-300"
                            aria-label={`${option.name} を選択解除`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}

                    {remaining > 0 && (
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                        他{remaining}件
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {modalOpen.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => (modalOpen.value = false)}
          >
            <div
              class="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 class="text-base font-semibold text-gray-900">{label}</h3>
                <button
                  type="button"
                  class="text-gray-500 hover:text-gray-700"
                  onClick={() => (modalOpen.value = false)}
                >
                  ✕
                </button>
              </div>

              <div class="space-y-4 p-4">
                <input
                  type="text"
                  value={searchQuery.value}
                  onInput={(event) => {
                    searchQuery.value =
                      (event.target as HTMLInputElement).value;
                  }}
                  placeholder="キーワードで検索"
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div class="max-h-72 space-y-2 overflow-y-auto rounded border border-gray-200 p-2">
                  {filteredOptions.length > 0
                    ? filteredOptions.map((option) => {
                      const isSelected = selectedIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleSelected(option.id)}
                          class={isSelected
                            ? "flex w-full items-center justify-between rounded border border-blue-500 bg-blue-50 px-3 py-2 text-left text-sm font-medium text-blue-700"
                            : "flex w-full items-center justify-between rounded border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"}
                        >
                          <span>{option.name}</span>
                          <span>{isSelected ? "✓" : ""}</span>
                        </button>
                      );
                    })
                    : (
                      <p class="px-2 py-4 text-center text-sm text-gray-500">
                        一致する項目がありません。
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div class="flex min-w-0 items-center gap-3">
            {mode === "edit" && gameId.value !== null && (
              <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <div class="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  ID
                </div>
                <div class="font-mono text-sm font-bold text-gray-800">
                  {gameId.value}
                </div>
              </div>
            )}
            <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
              {mode === "edit" ? "ゲーム編集" : "ゲーム新規登録"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/games"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="game-form"
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

      <form id="game-form" onSubmit={handleSubmit} class="space-y-8 p-4 sm:p-6">
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
              onInput={(event) =>
                updateField("name", (event.target as HTMLInputElement).value)}
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
              onInput={(event) =>
                updateField("kana", (event.target as HTMLInputElement).value)}
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
              onInput={(event) =>
                updateField(
                  "overview",
                  (event.target as HTMLTextAreaElement).value,
                )}
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
              onInput={(event) =>
                updateField("code", (event.target as HTMLInputElement).value)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="GB-001"
              required
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              価格
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.value.listPrice}
              onInput={(event) =>
                updateField(
                  "listPrice",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1980"
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              サブジャンル
            </label>
            <input
              type="text"
              value={form.value.subGenre}
              maxLength={100}
              onInput={(event) =>
                updateField(
                  "subGenre",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              キャッチコピー
            </label>
            <input
              type="text"
              value={form.value.catchCopy}
              maxLength={100}
              onInput={(event) =>
                updateField(
                  "catchCopy",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">
              サブキャッチ
            </label>
            <input
              type="text"
              value={form.value.subCatch}
              maxLength={200}
              onInput={(event) =>
                updateField(
                  "subCatch",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              公式URL
            </label>
            <input
              type="url"
              value={form.value.officialSiteUrl}
              onInput={(event) =>
                updateField(
                  "officialSiteUrl",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              YoutubeURL
            </label>
            <input
              type="url"
              value={form.value.youtubeUrl}
              onInput={(event) =>
                updateField(
                  "youtubeUrl",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v="
            />
          </div>

          <div class="space-y-2 md:col-span-1">
            <label class="block text-sm font-medium text-gray-700">
              リリース日
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.value.releaseDate}
              onInput={(event) =>
                updateField(
                  "releaseDate",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="md:col-span-2">
            {renderSingleSelectField(
              "メーカー",
              true,
              manufacturers.value,
              form.value.manufacturerId,
              manufacturerModalOpen,
              manufacturerSearchQuery,
              (id) => updateField("manufacturerId", id),
              "メーカーを選択",
            )}
          </div>

          <div class="md:col-span-2">
            {renderSingleSelectField(
              "機種",
              true,
              machines.value,
              form.value.machineId,
              machineModalOpen,
              machineSearchQuery,
              (id) => updateField("machineId", id),
              "機種を選択",
            )}
          </div>

          <div class="md:col-span-2">
            {renderSingleSelectField(
              "ジャンル",
              true,
              genres.value,
              form.value.genreId,
              genreModalOpen,
              genreSearchQuery,
              (id) => updateField("genreId", id),
              "ジャンルを選択",
            )}
          </div>

          <div class="md:col-span-2">
            {renderMultiSelectField(
              "キーワード（任意）",
              keywords.value,
              selectedKeywordIds.value,
              keywordModalOpen,
              keywordSearchQuery,
              (id) => {
                if (selectedKeywordIds.value.includes(id)) {
                  selectedKeywordIds.value = selectedKeywordIds.value.filter((
                    currentId,
                  ) => currentId !== id);
                  return;
                }
                selectedKeywordIds.value = [...selectedKeywordIds.value, id];
              },
            )}
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">
              プレイ済み
              <span class="ml-1 text-red-500">*</span>
            </label>
            <div class="flex items-center gap-6 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isPlay"
                  checked={form.value.isPlay === true}
                  onChange={() => updateField("isPlay", true)}
                />
                プレイ済み
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isPlay"
                  checked={form.value.isPlay === false}
                  onChange={() => updateField("isPlay", false)}
                />
                未プレイ
              </label>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">
              クリア済み
              <span class="ml-1 text-red-500">*</span>
            </label>
            <div class="flex items-center gap-6 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isClear"
                  checked={form.value.isClear === true}
                  onChange={() => updateField("isClear", true)}
                />
                クリア済み
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isClear"
                  checked={form.value.isClear === false}
                  onChange={() => updateField("isClear", false)}
                />
                未クリア
              </label>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">
              お気に入り
              <span class="ml-1 text-red-500">*</span>
            </label>
            <div class="flex items-center gap-6 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isFavourite"
                  checked={form.value.isFavourite === true}
                  onChange={() => updateField("isFavourite", true)}
                />
                有効
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="isFavourite"
                  checked={form.value.isFavourite === false}
                  onChange={() => updateField("isFavourite", false)}
                />
                無効
              </label>
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div class="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => void handleDelete()}
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

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
