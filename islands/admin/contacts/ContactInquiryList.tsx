import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import type { ContactInquiryItem } from "../../../utils/appApi.ts";
import type { ComponentChildren } from "preact";

interface Props {
  rightActions?: ComponentChildren;
  createHref?: string;
  showCreate?: boolean;
}

export default function ContactInquiryList(
  { rightActions, createHref = "/admin/contacts", showCreate = false }: Props,
) {
  const fetchPage = async (page: number, limit: number, query: string) => {
    return await adminFetch<PaginatedResponse<ContactInquiryItem>>(
      `/admin/contacts?page=${page}&limit=${limit}&q=${
        encodeURIComponent(query)
      }`,
    );
  };

  return (
    <PaginatedResourceTable<ContactInquiryItem>
      fetchPage={fetchPage}
      searchPlaceholder="名前・メール・件名・本文で検索"
      emptyMessage="問い合わせはまだありません。"
      emptySearchMessage="条件に一致する問い合わせがありません。"
      getKey={(item) => item.id}
      getRowHref={(item) => `/admin/contacts/${item.id}`}
      rowAriaLabel={(item) => `${item.subject} を確認`}
      getRowClassName={(item) =>
        item.status === "NEW"
          ? "bg-red-50 hover:bg-red-100"
          : item.status === "DONE"
          ? "bg-gray-100 hover:bg-gray-200"
          : "hover:bg-gray-50"}
      showRowChevron={true}
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">{item.subject}</p>
          <p class="text-xs text-gray-500">{item.name} / {item.status}</p>
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            件名
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            送信者
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            状態
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            受信日
          </th>
        </>
      )}
      renderDesktopRow={(item) => (
        <>
          <td class="px-4 py-3">
            <div class="font-medium text-gray-900">{item.subject}</div>
            <div class="mt-1 text-xs text-gray-500 line-clamp-2">
              {item.message}
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">
            {item.name}
            <br />
            {item.email}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">{item.status}</td>
          <td class="px-4 py-3 text-sm text-gray-700">
            {item.createdAt.slice(0, 10)}
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
