import { useSignal } from "@preact/signals";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";
import {
  type AccessLogItem,
  fetchAccessLogs,
  type LogKind,
  type LogLevel,
  type LogScope,
  type LogSource,
} from "../../../utils/adminAccessLog.ts";

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function stackOf(item: AccessLogItem): string | undefined {
  const raw = item.fields?.stack;
  return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
}

interface AccessLogListProps {
  initialSource?: LogSource;
  initialScope?: LogScope;
  initialKind?: LogKind;
  initialLevel?: LogLevel;
  initialDate?: string;
  backHref?: string;
}

export default function AccessLogList(props: AccessLogListProps) {
  const source = useSignal<LogSource>(props.initialSource || "backend");
  const scope = useSignal<LogScope>(props.initialScope || "app");
  const kind = useSignal<LogKind>(props.initialKind || "error");
  const level = useSignal<LogLevel>(props.initialLevel || "info");
  const targetDate = useSignal(props.initialDate || todayAsInputDate());

  const fetchPage = async (page: number, limit: number, query: string) => {
    const result = await fetchAccessLogs({
      page,
      limit,
      query,
      source: source.value,
      scope: scope.value,
      kind: kind.value,
      level: level.value,
      date: targetDate.value,
    });

    return {
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    } satisfies PaginatedResponse<AccessLogItem>;
  };

  return (
    <PaginatedResourceTable<AccessLogItem>
      fetchPage={fetchPage}
      searchPlaceholder="path / message / method で検索"
      emptyMessage="ログはまだありません。"
      emptySearchMessage="条件に一致するログはありません。"
      rightActions={
        <div class="flex flex-wrap items-end gap-3">
          <label class="text-xs font-medium text-slate-700">
            日付
            <input
              type="date"
              value={targetDate.value}
              onInput={(e) => {
                targetDate.value = (e.target as HTMLInputElement).value;
                globalThis.dispatchEvent(new Event("resource-table-search"));
              }}
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <a
            href={props.backHref || "/admin/logs"}
            class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            一覧へ戻る
          </a>
        </div>
      }
      getKey={(item) => item.id}
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">
            {item.path || "-"}
          </p>
          <p class="text-xs text-gray-600">
            {item.timestamp?.slice(0, 19).replace("T", " ") || "-"}
          </p>
          <p class="text-xs text-gray-500">
            {item.method || "-"} / {item.statusCode || "-"}
          </p>
          <p class="text-xs text-gray-500 line-clamp-2">{item.message}</p>
          {stackOf(item) && (
            <details class="text-xs text-gray-500">
              <summary class="cursor-pointer text-blue-600">
                スタックトレースを表示
              </summary>
              <pre class="mt-1 max-h-64 overflow-auto rounded bg-slate-900 p-2 text-[11px] text-slate-100 whitespace-pre-wrap">
                {stackOf(item)}
              </pre>
            </details>
          )}
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            日時
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
            {item.timestamp?.slice(0, 19).replace("T", " ") || "-"}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700 max-w-[320px] truncate">
            {item.path || "-"}
          </td>
          <td class="px-4 py-3 text-xs text-gray-600">
            <div>
              method: {item.method || "-"} / status: {item.statusCode || "-"}
            </div>
            <div class="line-clamp-2">message: {item.message || "-"}</div>
            {stackOf(item) && (
              <details>
                <summary class="cursor-pointer text-blue-600">
                  スタックトレースを表示
                </summary>
                <pre class="mt-1 max-h-64 max-w-[480px] overflow-auto rounded bg-slate-900 p-2 text-[11px] text-slate-100 whitespace-pre-wrap">
                  {stackOf(item)}
                </pre>
              </details>
            )}
          </td>
        </>
      )}
    />
  );
}
