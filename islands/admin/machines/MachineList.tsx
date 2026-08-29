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
  manufacturerName?: string;
  createdAt: string;
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

  const selectedManufacturers = manufacturers.value.filter((manufacturer) =>
    selectedManufacturerIds.value.includes(manufacturer.id)
  );

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
      <div class="flex items-center justify-between gap-3">
        <label class="block text-sm font-medium text-gray-700">メーカー</label>
      </div>

      <button
        type="button"
        onClick={() => (manufacturerModalOpen.value = true)}
        class="w-full flex items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>
          {selectedManufacturers.length > 0
            ? `${selectedManufacturers.length}件選択中`
            : "メーカーを選択"}
        </span>
        <span class="text-gray-400">＋</span>
      </button>

      {selectedManufacturers.length > 0 && (
        <div class="flex flex-wrap gap-2">
          {selectedManufacturers.map((manufacturer) => (
            <span
              key={manufacturer.id}
              class="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
            >
              {manufacturer.name}
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
        </div>
      )}

      <p class="text-xs text-gray-500">
        複数選択可。選択したメーカーに含まれる機種のみを絞り込みます。
      </p>

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

        return await adminFetch<PaginatedResponse<Machine>>(
          `/admin/machines?${params.toString()}`,
        );
      }}
      searchPlaceholder="機種名で検索"
      emptyMessage="登録されている機種はありません。"
      emptySearchMessage="検索条件に一致する機種はありません。"
      getKey={(machine) => machine.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-16">ID</th>
          <th class="p-4">名前</th>
          <th class="p-4">メーカー</th>
          <th class="p-4 w-40">登録日</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(machine) => (
        <>
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-mono text-gray-400 block mb-0.5">
                ID: {machine.id}
              </span>
              <h3 class="font-bold text-gray-900 text-base">{machine.name}</h3>
            </div>
            <div class="flex items-center gap-3 text-sm">
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
              <span class="text-gray-400 text-xs w-20">メーカー:</span>
              <span>{machine.manufacturerName ?? "-"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">登録日:</span>
              <span class="text-gray-500">
                {new Date(machine.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(machine) => (
        <>
          <td class="p-4 font-mono text-gray-400">{machine.id}</td>
          <td class="p-4 font-bold text-gray-900">{machine.name}</td>
          <td class="p-4 text-gray-500">{machine.manufacturerName ?? "-"}</td>
          <td class="p-4 text-gray-400">
            {new Date(machine.createdAt).toLocaleDateString("ja-JP")}
          </td>
          <td class="p-4 text-center space-x-2">
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
