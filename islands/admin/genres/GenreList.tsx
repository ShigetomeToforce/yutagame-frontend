import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ComponentChildren } from "preact";

interface Genre {
  id: number;
  name: string;
  kana: string;
  createdAt: string;
}

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

export default function GenreList(
  { rightActions, createHref, showCreate = true }: Props,
) {
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

  return (
    <PaginatedResourceTable<Genre>
      rightActions={actions}
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        return await adminFetch<PaginatedResponse<Genre>>(
          `/admin/genres?${params.toString()}`,
        );
      }}
      searchPlaceholder="ジャンル名またはかなで検索"
      emptyMessage="登録されているジャンルはありません。"
      emptySearchMessage="検索条件に一致するジャンルはありません。"
      getKey={(genre) => genre.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-16">ID</th>
          <th class="p-4">名前</th>
          <th class="p-4">かな</th>
          <th class="p-4 w-40">登録日</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(genre) => (
        <>
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-mono text-gray-400 block mb-0.5">
                ID: {genre.id}
              </span>
              <h3 class="font-bold text-gray-900 text-base">{genre.name}</h3>
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
              <span class="text-gray-400 text-xs w-20">かな:</span>
              <span>{genre.kana}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">登録日:</span>
              <span class="text-gray-500">
                {new Date(genre.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(genre) => (
        <>
          <td class="p-4 font-mono text-gray-400">{genre.id}</td>
          <td class="p-4 font-bold text-gray-900">{genre.name}</td>
          <td class="p-4 text-gray-500">{genre.kana}</td>
          <td class="p-4 text-gray-400">
            {new Date(genre.createdAt).toLocaleDateString("ja-JP")}
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
