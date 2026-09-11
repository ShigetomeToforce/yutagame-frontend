import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";
import type { FeatureItem } from "../../../utils/appApi.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";

const statusLabel = (status: string): string =>
  status === "PUBLISHED" ? "公開" : "下書き";

const formatDateTime = (value?: string | null): string => {
  if (!value) return "未指定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未指定";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${
    pad(date.getDate())
  } ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatPublishPeriod = (item: FeatureItem): string => {
  const start = formatDateTime(item.publishStartAt);
  const end = formatDateTime(item.publishEndAt);
  if (start === "未指定" && end === "未指定") return "期間指定なし";
  return `${start} 〜 ${end}`;
};

export default function FeatureList() {
  const fetchPage = async (page: number, limit: number, query: string) => {
    return await adminFetch<PaginatedResponse<FeatureItem>>(
      `/admin/features?page=${page}&limit=${limit}&q=${
        encodeURIComponent(query)
      }`,
    );
  };

  return (
    <PaginatedResourceTable<FeatureItem>
      fetchPage={fetchPage}
      searchPlaceholder="特集タイトル・コードで検索"
      emptyMessage="特集はまだありません。"
      emptySearchMessage="条件に一致する特集がありません。"
      getKey={(item) => item.id}
      getRowHref={(item) => `/admin/features/${item.id}`}
      rowAriaLabel={(item) => `${item.title} を編集`}
      showRowChevron
      renderMobileRow={(item) => (
        <div class="space-y-2">
          <div class="flex gap-3">
            <img
              src={buildImageUrl(item.thumbnailImageKey, "features")}
              alt=""
              class="h-16 w-24 rounded-md object-cover ring-1 ring-slate-200"
            />
            <div class="min-w-0 flex-1">
              <p
                class="truncate font-semibold text-gray-900"
                title={item.title}
              >
                {item.title}
              </p>
              <p class="truncate text-xs text-gray-500" title={item.code}>
                {item.code}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{formatPublishPeriod(item)}</span>
            <span>
              アクセス数: {(item.accessCount ?? 0).toLocaleString()}
            </span>
            <span
              class={`rounded-full px-2 py-0.5 font-bold ${
                item.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {statusLabel(item.status)}
            </span>
          </div>
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-600">
            サムネイル
          </th>
          <th class="w-[45%] px-4 py-3 text-left text-sm font-semibold text-gray-600">
            タイトル
          </th>
          <th class="w-24 px-4 py-3 text-left text-sm font-semibold text-gray-600">
            状態
          </th>
          <th class="w-48 px-4 py-3 text-left text-sm font-semibold text-gray-600">
            公開期間
          </th>
          <th class="w-24 px-4 py-3 text-left text-sm font-semibold text-gray-600">
            ゲーム数
          </th>
          <th class="w-28 px-4 py-3 text-right text-sm font-semibold text-gray-600">
            アクセス数
          </th>
        </>
      )}
      renderDesktopRow={(item) => (
        <>
          <td class="w-32 px-4 py-3">
            <img
              src={buildImageUrl(item.thumbnailImageKey, "features")}
              alt=""
              class="h-14 w-24 rounded-md object-cover ring-1 ring-slate-200"
            />
          </td>
          <td class="max-w-0 px-4 py-3">
            <div class="min-w-0">
              <div
                class="truncate font-medium text-gray-900"
                title={item.title}
              >
                {item.title}
              </div>
              <div
                class="mt-1 truncate text-xs text-gray-500"
                title={item.code}
              >
                {item.code}
              </div>
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
          <td class="w-48 px-4 py-3 text-sm leading-relaxed text-gray-700">
            {formatPublishPeriod(item)}
          </td>
          <td class="w-24 px-4 py-3 text-sm text-gray-700">
            {item.games?.length ?? 0}
          </td>
          <td class="w-28 px-4 py-3 text-right text-sm text-gray-700">
            {(item.accessCount ?? 0).toLocaleString()}
          </td>
        </>
      )}
      rightActions={
        <a
          href="/admin/features/create"
          class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </a>
      }
    />
  );
}
