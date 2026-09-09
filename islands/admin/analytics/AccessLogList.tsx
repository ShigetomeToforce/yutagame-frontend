import { useSignal } from "@preact/signals";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import {
  type AccessLogItem,
  fetchAccessLogs,
} from "../../../utils/adminAccessLog.ts";

export default function AccessLogList() {
  const eventType = useSignal("");
  const fromDate = useSignal("");
  const toDate = useSignal("");

  const fetchPage = async (page: number, limit: number, query: string) => {
    const result = await fetchAccessLogs(
      page,
      limit,
      query,
      eventType.value,
      fromDate.value,
      toDate.value,
    );

    return {
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    } satisfies PaginatedResponse<AccessLogItem>;
  };

  return (
    <PaginatedResourceTable<AccessLogItem>
      fetchPage={fetchPage}
      searchPlaceholder="path / 検索語 / visitor / gameCode"
      emptyMessage="アクセスログはまだありません。"
      emptySearchMessage="条件に一致するアクセスログはありません。"
      getKey={(item) => item.id}
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">
            {item.eventType} / {item.path}
          </p>
          <p class="text-xs text-gray-600">
            {item.createdAt?.slice(0, 19).replace("T", " ")}
          </p>
          <p class="text-xs text-gray-500">
            {item.method} {item.statusCode} / v:{item.visitorId || "-"}
          </p>
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            日時
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            種別
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            path
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            詳細
          </th>
        </>
      )}
      renderDesktopRow={(item) => (
        <>
          <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
            {item.createdAt?.slice(0, 19).replace("T", " ")}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
            {item.eventType}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700 max-w-[320px] truncate">
            {item.path}
          </td>
          <td class="px-4 py-3 text-xs text-gray-600">
            <div>method: {item.method} / status: {item.statusCode || "-"}</div>
            <div>visitor: {item.visitorId || "-"}</div>
            <div>
              m:{item.machineCode || "-"} mf:{item.manufacturerCode || "-"}{" "}
              g:{item.genreCode || "-"} k:{item.keywordCode || "-"}
            </div>
            <div>
              q: {item.searchWord || "-"} game: {item.gameCode || "-"} af:{" "}
              {item.affiliateCategory || "-"}
            </div>
          </td>
        </>
      )}
      searchExtras={
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-xs text-gray-700">
            イベント種別
            <select
              value={eventType.value}
              onChange={(e) => {
                eventType.value = (e.target as HTMLSelectElement).value;
              }}
              class="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="">すべて</option>
              <option value="page_view">page_view</option>
              <option value="api_hit">api_hit</option>
              <option value="search">search</option>
              <option value="affiliate_click">affiliate_click</option>
              <option value="error">error</option>
            </select>
          </label>

          <label class="text-xs text-gray-700">
            開始日
            <input
              type="date"
              value={fromDate.value}
              onInput={(e) => {
                fromDate.value = (e.target as HTMLInputElement).value;
              }}
              class="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
            />
          </label>

          <label class="text-xs text-gray-700">
            終了日
            <input
              type="date"
              value={toDate.value}
              onInput={(e) => {
                toDate.value = (e.target as HTMLInputElement).value;
              }}
              class="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
            />
          </label>

          <div class="flex items-end">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("resource-table-search"));
              }}
              class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              条件を適用
            </button>
          </div>
        </div>
      }
    />
  );
}
