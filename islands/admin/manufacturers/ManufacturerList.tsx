import { adminFetch } from "../../../utils/api.ts";
import CsvImportExportActions from "../common/CsvImportExportActions.tsx";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ComponentChildren } from "preact";

interface Manufacturer {
  id: number;
  code: string;
  name: string;
  kana: string;
}

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

const EXPORT_COLUMNS = [
  { key: "name", label: "名前" },
  { key: "kana", label: "カナ" },
  { key: "overview", label: "概要" },
  { key: "code", label: "コード" },
] as const;

export default function ManufacturerList(
  { rightActions, createHref, showCreate = true }: Props,
) {
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

  const actions = rightActions ?? (
    <CsvImportExportActions
      resourceLabel="メーカー"
      fileNamePrefix="manufacturers"
      exportEndpoint="/admin/manufacturers/export"
      previewEndpoint="/admin/manufacturers/import/preview"
      applyEndpoint="/admin/manufacturers/import/apply"
      exportColumns={[...EXPORT_COLUMNS]}
      defaultSelectedColumns={["name", "kana", "overview", "code"]}
      trailingAction={createButton}
    />
  );

  const truncateText = (
    value: string | number | undefined,
    maxLength: number,
  ) => {
    const text = String(value ?? "").trim();
    if (!text || text === "-") return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  };

  return (
    <PaginatedResourceTable<Manufacturer>
      rightActions={actions}
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        return await adminFetch<PaginatedResponse<Manufacturer>>(
          `/admin/manufacturers?${params.toString()}`,
        );
      }}
      searchPlaceholder="メーカー名またはカナで検索"
      emptyMessage="登録されているメーカーはいません。"
      emptySearchMessage="検索条件に一致するメーカーはいません。"
      getKey={(manufacturer) => manufacturer.id}
      getRowHref={(manufacturer) =>
        `/admin/manufacturers/${encodeURIComponent(manufacturer.code)}`}
      rowAriaLabel={(manufacturer) => `${manufacturer.name} の編集画面へ移動`}
      showRowChevron
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-52">名前</th>
          <th class="p-4 w-52">カナ</th>
        </>
      )}
      renderMobileRow={(manufacturer) => (
        <>
          <div class="flex items-start gap-3">
            <div class="min-w-0">
              <h3
                class="font-bold text-gray-900 text-base truncate"
                title={manufacturer.name}
              >
                {truncateText(manufacturer.name, 20)}
              </h3>
            </div>
          </div>

          <div class="text-sm space-y-1 text-gray-600">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">カナ:</span>
              <span class="truncate" title={manufacturer.kana}>
                {truncateText(manufacturer.kana, 20)}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(manufacturer) => (
        <>
          <td
            class="p-4 font-bold text-gray-900 w-52 max-w-[12rem] truncate"
            title={manufacturer.name}
          >
            {truncateText(manufacturer.name, 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={manufacturer.kana}
          >
            {truncateText(manufacturer.kana, 20)}
          </td>
        </>
      )}
    />
  );
}
