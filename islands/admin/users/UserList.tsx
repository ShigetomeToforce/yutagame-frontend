import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";

interface User {
  id: number;
  name: string;
  email: string;
}

import type { ComponentChildren } from "preact";

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

export default function UserList(
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

  const truncateText = (
    value: string | number | undefined,
    maxLength: number,
  ) => {
    const text = String(value ?? "").trim();
    if (!text || text === "-") return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  };

  return (
    <PaginatedResourceTable<User>
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        return await adminFetch<PaginatedResponse<User>>(
          `/admin/users?${params.toString()}`,
        );
      }}
      searchPlaceholder="ユーザー名またはメールアドレスで検索"
      emptyMessage="登録されているユーザーはいません。"
      emptySearchMessage="検索条件に一致するユーザーはいません。"
      getKey={(user) => user.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-64">名前</th>
          <th class="p-4 w-72">メールアドレス</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(user) => (
        <>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3
                class="font-bold text-gray-900 text-base truncate"
                title={user.name}
              >
                {truncateText(user.name, 30)}
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
              <span class="text-gray-400 text-xs w-20">メール:</span>
              <span class="break-all truncate" title={user.email}>
                {truncateText(user.email, 50)}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(user) => (
        <>
          <td
            class="p-4 font-bold text-gray-900 w-64 max-w-[15rem] truncate"
            title={user.name}
          >
            {truncateText(user.name, 30)}
          </td>
          <td
            class="p-4 text-gray-500 w-72 max-w-[18rem] truncate"
            title={user.email}
          >
            {truncateText(user.email, 50)}
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
      rightActions={actions}
    />
  );
}
