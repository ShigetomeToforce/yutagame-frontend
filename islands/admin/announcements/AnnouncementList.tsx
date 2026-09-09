import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { AnnouncementItem } from "../../../utils/appApi.ts";
import type { ComponentChildren } from "preact";

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

export default function AnnouncementList(
  {
    rightActions,
    createHref = "/admin/announcements/create",
    showCreate = true,
  }: Props,
) {
  const fetchPage = async (page: number, limit: number, query: string) => {
    const response = await adminFetch<PaginatedResponse<AnnouncementItem>>(
      `/admin/announcements?page=${page}&limit=${limit}&q=${
        encodeURIComponent(query)
      }`,
    );
    return response;
  };

  return (
    <PaginatedResourceTable<AnnouncementItem>
      fetchPage={fetchPage}
      searchPlaceholder="お知らせタイトル・概要で検索"
      emptyMessage="お知らせはまだありません。"
      emptySearchMessage="条件に一致するお知らせがありません。"
      getKey={(item) => item.id}
      getRowHref={(item) => `/admin/announcements/${item.id}`}
      rowAriaLabel={(item) => `${item.title} を編集`}
      showRowChevron={true}
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">{item.title}</p>
          <p class="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            タイトル
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            状態
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            公開日
          </th>
        </>
      )}
      renderDesktopRow={(item) => (
        <>
          <td class="px-4 py-3">
            <div class="font-medium text-gray-900">{item.title}</div>
            <div class="mt-1 text-xs text-gray-500 line-clamp-2">
              {item.excerpt}
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">{item.status}</td>
          <td class="px-4 py-3 text-sm text-gray-700">
            {item.publishedAt
              ? item.publishedAt.slice(0, 10)
              : item.createdAt.slice(0, 10)}
          </td>
        </>
      )}
      rightActions={rightActions ?? (showCreate
        ? (
          <a
            href={createHref}
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規作成
          </a>
        )
        : undefined)}
    />
  );
}
