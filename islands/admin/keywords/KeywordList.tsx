import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ComponentChildren } from "preact";

interface Keyword {
  id: number;
  code: string;
  name: string;
  kana: string;
  keywordType?: string;
}

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

export default function KeywordList(
  { rightActions, createHref, showCreate = true }: Props,
) {
  const handleDelete = async (id: number) => {
    const confirmed = globalThis.confirm(
      "このキーワードを削除してもよろしいですか？",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/keywords/${id}`, { method: "DELETE" });
      globalThis.location.reload();
    } catch (error) {
      globalThis.alert(
        error instanceof Error ? error.message : "削除に失敗しました。",
      );
    }
  };

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

  return (
    <PaginatedResourceTable<Keyword>
      rightActions={actions}
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        return await adminFetch<PaginatedResponse<Keyword>>(
          `/admin/keywords?${params.toString()}`,
        );
      }}
      searchPlaceholder="キーワード名またはカナで検索"
      emptyMessage="登録されているキーワードはありません。"
      emptySearchMessage="検索条件に一致するキーワードはありません。"
      getKey={(keyword) => keyword.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-52">名前</th>
          <th class="p-4 w-52">カナ</th>
          <th class="p-4 w-52">種別</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(keyword) => (
        <>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3
                class="font-bold text-gray-900 text-base truncate"
                title={keyword.name}
              >
                {truncateText(keyword.name, 20)}
              </h3>
            </div>
            <div class="flex items-center gap-3 text-sm shrink-0">
              <a
                href={`/admin/keywords/${encodeURIComponent(keyword.code)}`}
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </a>
              <button
                type="button"
                onClick={() => void handleDelete(keyword.id)}
                class="text-red-600 hover:text-red-800 font-medium"
              >
                削除
              </button>
            </div>
          </div>

          <div class="text-sm space-y-1 text-gray-600">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">カナ:</span>
              <span class="truncate" title={keyword.kana}>
                {truncateText(keyword.kana, 20)}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">種別:</span>
              <span class="truncate" title={keyword.keywordType ?? "-"}>
                {truncateText(keyword.keywordType ?? "-", 20)}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(keyword) => (
        <>
          <td
            class="p-4 font-bold text-gray-900 w-52 max-w-[12rem] truncate"
            title={keyword.name}
          >
            {truncateText(keyword.name, 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={keyword.kana}
          >
            {truncateText(keyword.kana, 20)}
          </td>
          <td
            class="p-4 text-gray-500 w-52 max-w-[12rem] truncate"
            title={keyword.keywordType ?? "-"}
          >
            {truncateText(keyword.keywordType ?? "-", 20)}
          </td>
          <td class="p-4 text-center space-x-2 w-32">
            <a
              href={`/admin/keywords/${encodeURIComponent(keyword.code)}`}
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              編集
            </a>
            <button
              type="button"
              onClick={() => void handleDelete(keyword.id)}
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
