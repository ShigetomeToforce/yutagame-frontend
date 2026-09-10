import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import AnalyticsNav from "./AnalyticsNav.tsx";
import {
  type AccessMonthlyRow,
  type AccessMonthlyTable,
  fetchAccessMonthlyTable,
} from "../../../utils/adminAccessLog.ts";

function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split("-");
  if (!year || !monthPart) {
    return month;
  }
  return `${year}年${Number(monthPart)}月`;
}

function ValueCell({ value }: { value: number }) {
  return (
    <td class="whitespace-nowrap px-3 py-2 text-right text-sm text-gray-800">
      {value.toLocaleString()}
    </td>
  );
}

export default function AccessDashboard() {
  const loading = useSignal(true);
  const error = useSignal("");
  const table = useSignal<AccessMonthlyTable | null>(null);
  const currentMonth = useSignal("");

  const load = async (month?: string) => {
    loading.value = true;
    error.value = "";
    try {
      const response = await fetchAccessMonthlyTable(month);
      table.value = response;
      currentMonth.value = response.month;
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : "ダッシュボードの取得に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading.value) {
    return (
      <div class="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
        読み込み中...
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error.value}
      </div>
    );
  }

  if (!table.value) {
    return (
      <div class="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
        データがありません。
      </div>
    );
  }

  const monthlyRows: AccessMonthlyRow[] = table.value.rows;
  const monthlySum = table.value.monthlySum;

  return (
    <div class="space-y-4">
      <AnalyticsNav current="access" />

      <section class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-lg font-bold text-gray-900">
            アクセス分析 {formatMonthLabel(currentMonth.value)}
          </h2>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load(table.value?.prevMonth)}
              class="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              前月
            </button>
            <button
              type="button"
              onClick={() => void load(table.value?.nextMonth)}
              class="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              次月
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
              <tr class="border-y border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                <th class="whitespace-nowrap px-3 py-2 text-left">日付</th>
                <th class="whitespace-nowrap px-3 py-2 text-right">PV</th>
                <th class="whitespace-nowrap px-3 py-2 text-right">UU</th>
                <th class="whitespace-nowrap px-3 py-2 text-right">検索数</th>
                <th class="whitespace-nowrap px-3 py-2 text-right">
                  機種検索数
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right">
                  メーカー検索数
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right">
                  ジャンル検索数
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right">
                  キーワード検索数
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right">
                  お問合せ数
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr class="border-b border-gray-100" key={row.date}>
                  <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
                    {row.date}
                  </td>
                  <ValueCell value={row.pageViews} />
                  <ValueCell value={row.uniqueVisitors} />
                  <ValueCell value={row.searchCount} />
                  <ValueCell value={row.machineSearches} />
                  <ValueCell value={row.makerSearches} />
                  <ValueCell value={row.genreSearches} />
                  <ValueCell value={row.keywordSearches} />
                  <ValueCell value={row.contactCount} />
                </tr>
              ))}
              <tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  {monthlySum.date}
                </td>
                <ValueCell value={monthlySum.pageViews} />
                <ValueCell value={monthlySum.uniqueVisitors} />
                <ValueCell value={monthlySum.searchCount} />
                <ValueCell value={monthlySum.machineSearches} />
                <ValueCell value={monthlySum.makerSearches} />
                <ValueCell value={monthlySum.genreSearches} />
                <ValueCell value={monthlySum.keywordSearches} />
                <ValueCell value={monthlySum.contactCount} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
