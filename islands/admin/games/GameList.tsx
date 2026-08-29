import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ComponentChildren } from "preact";

interface Game {
  id: number;
  code: string;
  name: string;
  kana?: string;
  manufacturerName?: string;
  machineName?: string;
  releaseDate?: string;
  manufacturer?: {
    name?: string;
  };
  machine?: {
    name?: string;
  };
}

interface OptionItem {
  id: number;
  name: string;
}

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

const SEARCH_REFRESH_EVENT = "resource-table-search";

const triggerSearchRefresh = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEARCH_REFRESH_EVENT));
  }
};

export default function GameList(
  { rightActions, createHref, showCreate = true }: Props,
) {
  const handleDelete = async (id: number) => {
    const confirmed = globalThis.confirm(
      "このゲームを削除してもよろしいですか？",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/games/${id}`, { method: "DELETE" });
      globalThis.location.reload();
    } catch (error) {
      globalThis.alert(
        error instanceof Error ? error.message : "削除に失敗しました。",
      );
    }
  };

  const manufacturers = useSignal<OptionItem[]>([]);
  const machines = useSignal<OptionItem[]>([]);
  const genres = useSignal<OptionItem[]>([]);
  const keywords = useSignal<OptionItem[]>([]);

  const selectedManufacturerIds = useSignal<number[]>([]);
  const selectedMachineIds = useSignal<number[]>([]);
  const selectedGenreIds = useSignal<number[]>([]);
  const selectedKeywordIds = useSignal<number[]>([]);

  const manufacturerModalOpen = useSignal(false);
  const machineModalOpen = useSignal(false);
  const genreModalOpen = useSignal(false);
  const keywordModalOpen = useSignal(false);

  const manufacturerSearchQuery = useSignal("");
  const machineSearchQuery = useSignal("");
  const genreSearchQuery = useSignal("");
  const keywordSearchQuery = useSignal("");

  const playStatus = useSignal("");
  const clearStatus = useSignal("");
  const favouriteStatus = useSignal("");

  useEffect(() => {
    void (async () => {
      try {
        const [
          manufacturerResponse,
          machineResponse,
          genreResponse,
          keywordResponse,
        ] = await Promise.all([
          adminFetch<OptionItem[] | PaginatedResponse<OptionItem>>(
            "/admin/manufacturers",
          ),
          adminFetch<OptionItem[] | PaginatedResponse<OptionItem>>(
            "/admin/machines",
          ),
          adminFetch<OptionItem[] | PaginatedResponse<OptionItem>>(
            "/admin/genres",
          ),
          adminFetch<OptionItem[] | PaginatedResponse<OptionItem>>(
            "/admin/keywords",
          ),
        ]);

        manufacturers.value = Array.isArray(manufacturerResponse)
          ? manufacturerResponse
          : (manufacturerResponse.data ?? []);
        machines.value = Array.isArray(machineResponse)
          ? machineResponse
          : (machineResponse.data ?? []);
        genres.value = Array.isArray(genreResponse)
          ? genreResponse
          : (genreResponse.data ?? []);
        keywords.value = Array.isArray(keywordResponse)
          ? keywordResponse
          : (keywordResponse.data ?? []);
      } catch {
        manufacturers.value = [];
        machines.value = [];
        genres.value = [];
        keywords.value = [];
      }
    })();
  }, []);

  const createButton = (createHref && showCreate)
    ? (
      <a
        href={createHref}
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
      >
        新規登録 <span>➕</span>
      </a>
    )
    : undefined;

  const actions = rightActions ?? createButton;

  const truncateText = (
    value: string | number | undefined,
    maxLength: number,
  ) => {
    const text = String(value ?? "").trim();
    if (!text || text === "-") return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const raw = value.split("T")[0];
    const [year, month, day] = raw.split("-").map(Number);
    if (!year || !month || !day) return "-";
    return `${year}年${month}月${day}日`;
  };

  const normalizeGame = (game: Game) => ({
    ...game,
    manufacturerName: game.manufacturerName ?? game.manufacturer?.name ?? "-",
    machineName: game.machineName ?? game.machine?.name ?? "-",
    kana: game.kana ?? "",
    releaseDate: game.releaseDate ?? "",
  });

  const toggleSelection = (selectedIds: number[], id: number) => {
    if (selectedIds.includes(id)) {
      return selectedIds.filter((currentId) => currentId !== id);
    }
    return [...selectedIds, id];
  };

  const renderSelectionField = (
    buttonLabel: string,
    options: OptionItem[],
    selectedIds: number[],
    modalOpenSignal: { value: boolean },
    searchSignal: { value: string },
    toggleSelected: (id: number) => void,
    selectedLabel: string,
  ) => {
    const selectedOptions = selectedIds
      .map((id) => options.find((option) => option.id === id))
      .filter((option): option is OptionItem => Boolean(option));

    const visibleSelected = selectedOptions.slice(0, 5);
    const hiddenSelectedCount = Math.max(0, selectedOptions.length - 5);
    const filteredOptions = options.filter((option) => {
      const q = searchSignal.value.trim().toLowerCase();
      if (!q) return true;
      return option.name.toLowerCase().includes(q);
    });

    return (
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={() => {
              modalOpenSignal.value = true;
            }}
            class="inline-flex w-fit items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{buttonLabel}</span>
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs">
              ＋
            </span>
          </button>

          {selectedOptions.length > 0 && (
            <div class="flex flex-wrap items-center gap-2 md:ml-5">
              {visibleSelected.map((option) => (
                <span
                  key={option.id}
                  class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                >
                  <span class="max-w-[8rem] truncate" title={option.name}>
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
              ))}
              {hiddenSelectedCount > 0 && (
                <span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  他{hiddenSelectedCount}件
                </span>
              )}
            </div>
          )}
        </div>

        {modalOpenSignal.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => (modalOpenSignal.value = false)}
          >
            <div
              class="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 class="text-base font-semibold text-gray-900">
                  {selectedLabel}
                </h3>
                <button
                  type="button"
                  class="text-gray-500 hover:text-gray-700"
                  onClick={() => (modalOpenSignal.value = false)}
                >
                  ✕
                </button>
              </div>

              <div class="space-y-4 p-4">
                <input
                  type="text"
                  value={searchSignal.value}
                  onInput={(e) => {
                    searchSignal.value = (e.target as HTMLInputElement).value;
                  }}
                  placeholder={`${selectedLabel}で検索`}
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
                          onClick={() => {
                            toggleSelected(option.id);
                          }}
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
                        一致する{selectedLabel}がありません。
                      </p>
                    )}
                </div>
              </div>

              <div class="flex justify-end border-t border-gray-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => (modalOpenSignal.value = false)}
                  class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  完了
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRadioGroup = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    options: Array<{ label: string; value: string }>,
  ) => (
    <div class="flex flex-wrap items-center gap-4 md:gap-6">
      <span class="w-28 text-sm font-medium text-gray-700">{label}</span>
      {options.map((option) => (
        <label
          class="flex items-center gap-2 text-sm text-gray-700"
          key={option.value}
        >
          <input
            type="radio"
            name={label}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => {
              setValue((e.target as HTMLInputElement).value);
              triggerSearchRefresh();
            }}
            class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <PaginatedResourceTable<Game>
      rightActions={actions}
      searchExtras={
        <div class="space-y-4">
          {renderSelectionField(
            "メーカーを選択",
            manufacturers.value,
            selectedManufacturerIds.value,
            manufacturerModalOpen,
            manufacturerSearchQuery,
            (id) => {
              selectedManufacturerIds.value = toggleSelection(
                selectedManufacturerIds.value,
                id,
              );
              triggerSearchRefresh();
            },
            "メーカー",
          )}
          {renderSelectionField(
            "ジャンルを選択",
            genres.value,
            selectedGenreIds.value,
            genreModalOpen,
            genreSearchQuery,
            (id) => {
              selectedGenreIds.value = toggleSelection(
                selectedGenreIds.value,
                id,
              );
              triggerSearchRefresh();
            },
            "ジャンル",
          )}
          {renderSelectionField(
            "機種を選択",
            machines.value,
            selectedMachineIds.value,
            machineModalOpen,
            machineSearchQuery,
            (id) => {
              selectedMachineIds.value = toggleSelection(
                selectedMachineIds.value,
                id,
              );
              triggerSearchRefresh();
            },
            "機種",
          )}
          {renderSelectionField(
            "キーワードを選択",
            keywords.value,
            selectedKeywordIds.value,
            keywordModalOpen,
            keywordSearchQuery,
            (id) => {
              selectedKeywordIds.value = toggleSelection(
                selectedKeywordIds.value,
                id,
              );
              triggerSearchRefresh();
            },
            "キーワード",
          )}

          <div class="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
            {renderRadioGroup(
              "プレイ状況",
              playStatus.value,
              (next) => {
                playStatus.value = next;
                triggerSearchRefresh();
              },
              [
                { label: "未指定", value: "" },
                { label: "未プレイ", value: "false" },
                { label: "プレイ済み", value: "true" },
              ],
            )}
          </div>

          <div class="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
            {renderRadioGroup(
              "クリア状況",
              clearStatus.value,
              (next) => {
                clearStatus.value = next;
                triggerSearchRefresh();
              },
              [
                { label: "未指定", value: "" },
                { label: "未クリア", value: "false" },
                { label: "クリア済み", value: "true" },
              ],
            )}
          </div>

          <div class="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
            {renderRadioGroup(
              "お気に入り",
              favouriteStatus.value,
              (next) => {
                favouriteStatus.value = next;
                triggerSearchRefresh();
              },
              [
                { label: "未指定", value: "" },
                { label: "お気に入り", value: "true" },
                { label: "通常", value: "false" },
              ],
            )}
          </div>
        </div>
      }
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        for (const manufacturerId of selectedManufacturerIds.value) {
          params.append("manufacturerIDs", String(manufacturerId));
        }

        for (const machineId of selectedMachineIds.value) {
          params.append("machineIDs", String(machineId));
        }

        for (const genreId of selectedGenreIds.value) {
          params.append("genreIDs", String(genreId));
        }

        for (const keywordId of selectedKeywordIds.value) {
          params.append("keywordIDs", String(keywordId));
        }

        if (playStatus.value !== "") {
          params.set("isPlay", playStatus.value);
        }

        if (clearStatus.value !== "") {
          params.set("isClear", clearStatus.value);
        }

        if (favouriteStatus.value !== "") {
          params.set("isFavourite", favouriteStatus.value);
        }

        const response = await adminFetch<PaginatedResponse<Game>>(
          `/admin/games?${params.toString()}`,
        );

        return {
          ...response,
          data: (response.data ?? []).map((game) => normalizeGame(game)),
        };
      }}
      searchPlaceholder="ゲーム名またはカナで検索"
      emptyMessage="登録されているゲームはありません。"
      emptySearchMessage="検索条件に一致するゲームはありません。"
      getKey={(game) => game.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-52">タイトル</th>
          <th class="p-4 w-52">カナ</th>
          <th class="p-4 w-52">メーカー</th>
          <th class="p-4 w-52">機種</th>
          <th class="p-4 w-40">発売日</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(game) => (
        <>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3
                class="font-bold text-gray-900 text-base truncate"
                title={game.name}
              >
                {truncateText(game.name, 20)}
              </h3>
            </div>
            <div class="flex items-center gap-3 text-sm shrink-0">
              <a
                href={`/admin/games/${encodeURIComponent(game.code)}`}
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </a>
              <button
                type="button"
                onClick={() => void handleDelete(game.id)}
                class="text-red-600 hover:text-red-800 font-medium"
              >
                削除
              </button>
            </div>
          </div>

          <div class="text-sm space-y-1 text-gray-600">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">カナ:</span>
              <span class="truncate" title={game.kana ?? "-"}>
                {truncateText(game.kana ?? "-", 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">メーカー:</span>
              <span class="truncate" title={game.manufacturerName ?? "-"}>
                {truncateText(game.manufacturerName ?? "-", 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">機種:</span>
              <span class="truncate" title={game.machineName ?? "-"}>
                {truncateText(game.machineName ?? "-", 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">発売日:</span>
              <span class="text-gray-500">{formatDate(game.releaseDate)}</span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(game) => (
        <>
          <td
            class="p-4 font-bold text-gray-900 w-52 max-w-[12rem] truncate"
            title={game.name}
          >
            {truncateText(game.name, 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={game.kana ?? "-"}
          >
            {truncateText(game.kana ?? "-", 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={game.manufacturerName ?? "-"}
          >
            {truncateText(game.manufacturerName ?? "-", 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={game.machineName ?? "-"}
          >
            {truncateText(game.machineName ?? "-", 20)}
          </td>
          <td class="p-4 text-gray-500 w-40 whitespace-nowrap">
            {formatDate(game.releaseDate)}
          </td>
          <td class="p-4 text-center space-x-2 w-32">
            <a
              href={`/admin/games/${encodeURIComponent(game.code)}`}
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              編集
            </a>
            <button
              type="button"
              onClick={() => void handleDelete(game.id)}
              class="text-red-600 hover:text-red-800 font-medium"
            >
              削除
            </button>
          </td>
        </>
      )}
    />
  );
}
