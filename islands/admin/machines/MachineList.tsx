import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ComponentChildren } from "preact";

interface Machine {
  id: number;
  name: string;
  kana?: string;
  manufacturerName?: string;
  releaseDate?: string;
  manufacturer?: {
    name?: string;
  };
}

interface Props {
  rightActions?: ComponentChildren;
  /** href for create page, if provided MachineList will render a create button */
  createHref?: string;
  /** whether to show the create button when createHref is provided (default true) */
  showCreate?: boolean;
}

interface ManufacturerOption {
  id: number;
  name: string;
}

export default function MachineList(
  { rightActions, createHref, showCreate = true }: Props,
) {
  const manufacturers = useSignal<ManufacturerOption[]>([]);
  const selectedManufacturerIds = useSignal<number[]>([]);
  const manufacturerModalOpen = useSignal(false);
  const manufacturerSearchQuery = useSignal("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await adminFetch<
          ManufacturerOption[] | PaginatedResponse<ManufacturerOption>
        >(
          "/admin/manufacturers",
        );

        manufacturers.value = Array.isArray(response)
          ? response
          : (response.data ?? []);
      } catch {
        manufacturers.value = [];
      }
    })();
  }, []);

  const createButton = (createHref && showCreate)
    ? (
      <a
        href={createHref}
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
      >
        <span>➕</span> 新規登録
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

  const normalizeMachine = (machine: Machine) => ({
    ...machine,
    manufacturerName: machine.manufacturerName ?? machine.manufacturer?.name ??
      "-",
    kana: machine.kana ?? "",
    releaseDate: machine.releaseDate ?? "",
  });

  const selectedManufacturers = selectedManufacturerIds.value
    .map((id) =>
      manufacturers.value.find((manufacturer) => manufacturer.id === id)
    )
    .filter((manufacturer): manufacturer is ManufacturerOption =>
      Boolean(manufacturer)
    );

  const visibleSelectedManufacturers = selectedManufacturers.slice(0, 5);
  const hiddenSelectedCount = Math.max(0, selectedManufacturers.length - 5);

  const filteredManufacturers = manufacturers.value.filter((manufacturer) => {
    const q = manufacturerSearchQuery.value.trim().toLowerCase();
    if (!q) return true;
    return manufacturer.name.toLowerCase().includes(q);
  });

  const toggleManufacturer = (manufacturerId: number) => {
    const isSelected = selectedManufacturerIds.value.includes(manufacturerId);
    if (isSelected) {
      selectedManufacturerIds.value = selectedManufacturerIds.value.filter((
        id,
      ) => id !== manufacturerId);
      return;
    }

    selectedManufacturerIds.value = [
      ...selectedManufacturerIds.value,
      manufacturerId,
    ];
  };

  const manufacturerSelect = (
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-3 md:gap-5">
        <button
          type="button"
          onClick={() => (manufacturerModalOpen.value = true)}
          class="inline-flex w-fit items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span>メーカーを選択</span>
          <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs">
            ＋
          </span>
        </button>

        {selectedManufacturers.length > 0 && (
          <div class="flex flex-wrap items-center gap-2 md:ml-5">
            {visibleSelectedManufacturers.map((manufacturer) => (
              <span
                key={manufacturer.id}
                class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                <span class="max-w-[8rem] truncate" title={manufacturer.name}>
                  {manufacturer.name}
                </span>
                <button
                  type="button"
                  onClick={() => toggleManufacturer(manufacturer.id)}
                  class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-300"
                  aria-label={`${manufacturer.name} を選択解除`}
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

      {manufacturerModalOpen.value && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => (manufacturerModalOpen.value = false)}
        >
          <div
            class="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 class="text-base font-semibold text-gray-900">
                メーカーを選択
              </h3>
              <button
                type="button"
                class="text-gray-500 hover:text-gray-700"
                onClick={() => (manufacturerModalOpen.value = false)}
              >
                ✕
              </button>
            </div>

            <div class="space-y-4 p-4">
              <input
                type="text"
                value={manufacturerSearchQuery.value}
                onInput={(e) => {
                  manufacturerSearchQuery.value =
                    (e.target as HTMLInputElement).value;
                }}
                placeholder="メーカー名で検索"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div class="max-h-72 space-y-2 overflow-y-auto rounded border border-gray-200 p-2">
                {filteredManufacturers.length > 0
                  ? filteredManufacturers.map((manufacturer) => {
                    const isSelected = selectedManufacturerIds.value.includes(
                      manufacturer.id,
                    );
                    return (
                      <button
                        key={manufacturer.id}
                        type="button"
                        onClick={() => toggleManufacturer(manufacturer.id)}
                        class={isSelected
                          ? "flex w-full items-center justify-between rounded border border-blue-500 bg-blue-50 px-3 py-2 text-left text-sm font-medium text-blue-700"
                          : "flex w-full items-center justify-between rounded border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"}
                      >
                        <span>{manufacturer.name}</span>
                        <span>{isSelected ? "✓" : ""}</span>
                      </button>
                    );
                  })
                  : (
                    <p class="px-2 py-4 text-center text-sm text-gray-500">
                      一致するメーカーがありません。
                    </p>
                  )}
              </div>
            </div>

            <div class="flex justify-end border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => (manufacturerModalOpen.value = false)}
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

  return (
    <PaginatedResourceTable<Machine>
      rightActions={actions}
      searchExtras={manufacturerSelect}
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

        const response = await adminFetch<PaginatedResponse<Machine>>(
          `/admin/machines?${params.toString()}`,
        );

        return {
          ...response,
          data: (response.data ?? []).map((machine) =>
            normalizeMachine(machine)
          ),
        };
      }}
      searchPlaceholder="機種名またはカナで検索"
      emptyMessage="登録されている機種はありません。"
      emptySearchMessage="検索条件に一致する機種はありません。"
      getKey={(machine) => machine.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-52">名前</th>
          <th class="p-4 w-52">カナ</th>
          <th class="p-4 w-52">メーカー</th>
          <th class="p-4 w-40">発売日</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(machine) => (
        <>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3
                class="font-bold text-gray-900 text-base truncate"
                title={machine.name}
              >
                {truncateText(machine.name, 20)}
              </h3>
            </div>
            <div class="flex items-center gap-3 text-sm shrink-0">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </button>
              <button
                type="button"
                class="text-red-600 hover:text-red-800 font-medium"
              >
                削除
              </button>
            </div>
          </div>

          <div class="text-sm space-y-1 text-gray-600">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">カナ:</span>
              <span class="truncate" title={machine.kana ?? "-"}>
                {truncateText(machine.kana ?? "-", 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">メーカー:</span>
              <span class="truncate" title={machine.manufacturerName ?? "-"}>
                {truncateText(machine.manufacturerName ?? "-", 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">発売日:</span>
              <span class="text-gray-500">
                {formatDate(machine.releaseDate)}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(machine) => (
        <>
          <td
            class="p-4 font-bold text-gray-900 w-52 max-w-[12rem] truncate"
            title={machine.name}
          >
            {truncateText(machine.name, 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={machine.kana ?? "-"}
          >
            {truncateText(machine.kana ?? "-", 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={machine.manufacturerName ?? "-"}
          >
            {truncateText(machine.manufacturerName ?? "-", 20)}
          </td>
          <td class="p-4 text-gray-500 w-40 whitespace-nowrap">
            {formatDate(machine.releaseDate)}
          </td>
          <td class="p-4 text-center space-x-2 w-32">
            <button
              type="button"
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              編集
            </button>
            <button
              type="button"
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
