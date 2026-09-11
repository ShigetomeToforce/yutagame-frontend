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

const statusLabel = (status: string): string =>
  status === "PUBLISHED" ? "公開" : "下書き";

// ISO日時文字列を yyyy/MM/dd HH:mm 形式に整形する
const formatDateTime = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${
    pad(date.getDate())
  } ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatPublishPeriod = (item: AnnouncementItem): string => {
  const start = formatDateTime(item.publishStartAt);
  const end = formatDateTime(item.publishEndAt);
  if (!start && !end) return "期間指定なし";
  return `${start || "指定なし"} \u301c ${end || "指定なし"}`;
};

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
      showRowChevron
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">{item.title}</p>
          <p class="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
          <p class="text-xs text-gray-500">{formatPublishPeriod(item)}</p>
          <p class="text-xs text-gray-500">
            アクセス数: {(item.accessCount ?? 0).toLocaleString()}
          </p>
          <span
            class={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
              item.status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {statusLabel(item.status)}
          </span>
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
            公開期間
          </th>
          <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600">
            アクセス数
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
          <td class="px-4 py-3 text-sm text-gray-700">
            <span
              class={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                item.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {statusLabel(item.status)}
            </span>
          </td>
          <td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">
            {formatPublishPeriod(item)}
          </td>
          <td class="px-4 py-3 text-right text-sm text-gray-700">
            {(item.accessCount ?? 0).toLocaleString()}
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
