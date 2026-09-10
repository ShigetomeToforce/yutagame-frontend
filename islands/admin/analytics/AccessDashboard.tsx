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

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return { year, month, day, date };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${
    String(day).padStart(2, "0")
  }`;
}

function nthMonday(year: number, month: number, nth: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const firstMonday = firstDay === 1 ? 1 : 9 - firstDay;
  return firstMonday + (nth - 1) * 7;
}

function springEquinoxDay(year: number): number {
  return Math.floor(
    20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function autumnEquinoxDay(year: number): number {
  return Math.floor(
    23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function buildJapaneseHolidaySet(year: number): Set<string> {
  const holidays = new Set<string>();
  const add = (month: number, day: number) =>
    holidays.add(dateKey(year, month, day));

  add(1, 1);
  add(1, nthMonday(year, 1, 2));
  add(2, 11);
  if (year >= 2020) add(2, 23);
  add(3, springEquinoxDay(year));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  if (year >= 2016) add(8, 11);
  add(7, nthMonday(year, 7, 3));
  add(9, nthMonday(year, 9, 3));
  add(9, autumnEquinoxDay(year));
  add(10, nthMonday(year, 10, 2));
  add(11, 3);
  add(11, 23);

  for (let month = 1; month <= 12; month++) {
    for (let day = 2; day <= 30; day++) {
      const key = dateKey(year, month, day);
      if (
        !holidays.has(key) && holidays.has(dateKey(year, month, day - 1)) &&
        holidays.has(dateKey(year, month, day + 1))
      ) {
        holidays.add(key);
      }
    }
  }

  for (const key of Array.from(holidays).sort()) {
    const parsed = parseDateValue(key);
    if (!parsed || parsed.date.getDay() !== 0) continue;
    const substitute = new Date(parsed.year, parsed.month - 1, parsed.day + 1);
    while (
      holidays.has(
        dateKey(
          substitute.getFullYear(),
          substitute.getMonth() + 1,
          substitute.getDate(),
        ),
      )
    ) {
      substitute.setDate(substitute.getDate() + 1);
    }
    holidays.add(
      dateKey(
        substitute.getFullYear(),
        substitute.getMonth() + 1,
        substitute.getDate(),
      ),
    );
  }

  return holidays;
}

function formatDashboardDate(value: string): string {
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  return `${parsed.year}年${parsed.month}月${parsed.day}日(${
    weekdays[parsed.date.getDay()]
  })`;
}

function getDateRowClass(value: string): string {
  const parsed = parseDateValue(value);
  if (!parsed) return "";

  const today = new Date();
  if (
    dateKey(parsed.year, parsed.month, parsed.day) ===
      dateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())
  ) {
    return "bg-yellow-50";
  }

  const holidaySet = buildJapaneseHolidaySet(parsed.year);
  if (
    parsed.date.getDay() === 0 ||
    holidaySet.has(dateKey(parsed.year, parsed.month, parsed.day))
  ) {
    return "bg-pink-50";
  }
  if (parsed.date.getDay() === 6) {
    return "bg-sky-50";
  }
  return "";
}

function ValueCell({ value }: { value: number }) {
  return (
    <td class="whitespace-nowrap px-2 py-2 text-right text-sm text-gray-800">
      {value.toLocaleString()}
    </td>
  );
}

function HeaderCell({ children }: { children: string }) {
  return (
    <th class="whitespace-nowrap px-2 py-2 text-right text-[11px] font-semibold leading-tight text-gray-600">
      {children}
    </th>
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
          <table class="w-full min-w-[1008px] table-fixed border-collapse">
            <thead>
              <tr class="border-y border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                <th class="w-40 whitespace-nowrap px-2 py-2 text-left text-[11px] leading-tight">
                  日付
                </th>
                <HeaderCell>PV</HeaderCell>
                <HeaderCell>UU</HeaderCell>
                <HeaderCell>全検索数</HeaderCell>
                <HeaderCell>機種検索</HeaderCell>
                <HeaderCell>メーカー</HeaderCell>
                <HeaderCell>ジャンル</HeaderCell>
                <HeaderCell>キーワード</HeaderCell>
                <HeaderCell>お知らせ</HeaderCell>
                <HeaderCell>特集</HeaderCell>
                <HeaderCell>バナー</HeaderCell>
                <HeaderCell>お問合せ</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr
                  class={`border-b border-gray-100 ${
                    getDateRowClass(row.date)
                  }`}
                  key={row.date}
                >
                  <td class="w-40 whitespace-nowrap px-2 py-2 text-xs text-gray-700">
                    {formatDashboardDate(row.date)}
                  </td>
                  <ValueCell value={row.pageViews} />
                  <ValueCell value={row.uniqueVisitors} />
                  <ValueCell value={row.searchCount} />
                  <ValueCell value={row.machineSearches} />
                  <ValueCell value={row.makerSearches} />
                  <ValueCell value={row.genreSearches} />
                  <ValueCell value={row.keywordSearches} />
                  <ValueCell value={row.announcementViews} />
                  <ValueCell value={row.featureViews} />
                  <ValueCell value={row.bannerViews} />
                  <ValueCell value={row.contactCount} />
                </tr>
              ))}
              <tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td class="w-40 whitespace-nowrap px-2 py-2 text-xs text-gray-900">
                  {monthlySum.date}
                </td>
                <ValueCell value={monthlySum.pageViews} />
                <ValueCell value={monthlySum.uniqueVisitors} />
                <ValueCell value={monthlySum.searchCount} />
                <ValueCell value={monthlySum.machineSearches} />
                <ValueCell value={monthlySum.makerSearches} />
                <ValueCell value={monthlySum.genreSearches} />
                <ValueCell value={monthlySum.keywordSearches} />
                <ValueCell value={monthlySum.announcementViews} />
                <ValueCell value={monthlySum.featureViews} />
                <ValueCell value={monthlySum.bannerViews} />
                <ValueCell value={monthlySum.contactCount} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
