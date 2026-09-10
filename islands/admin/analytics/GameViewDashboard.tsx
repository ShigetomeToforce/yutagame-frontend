import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import AnalyticsNav from "./AnalyticsNav.tsx";
import {
  fetchGameViewDashboard,
  type MachineSearchPeriod,
  type RankingDashboard,
} from "../../../utils/adminAccessLog.ts";

function todayAsDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function todayAsMonthInput(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatTarget(period: MachineSearchPeriod, target: string): string {
  if (period === "daily") {
    const [y, m, d] = target.split("-").map(Number);
    if (!y || !m || !d) return target;
    return `${y}年${m}月${d}日`;
  }
  if (period === "monthly") {
    const [y, m] = target.split("-").map(Number);
    if (!y || !m) return target;
    return `${y}年${m}月`;
  }
  return "累計";
}

export default function GameViewDashboard() {
  const loading = useSignal(true);
  const error = useSignal("");
  const period = useSignal<MachineSearchPeriod>("daily");
  const date = useSignal(todayAsDateInput());
  const month = useSignal(todayAsMonthInput());
  const data = useSignal<RankingDashboard | null>(null);

  const load = async () => {
    loading.value = true;
    error.value = "";
    try {
      data.value = await fetchGameViewDashboard({
        period: period.value,
        date: date.value,
        month: month.value,
        limit: 100,
      });
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : "ゲーム詳細ランキングの取得に失敗しました。";
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div class="space-y-4">
      <AnalyticsNav current="game" />

      <section class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-gray-600">
              集計単位
            </label>
            <select
              value={period.value}
              onChange={(e) => {
                period.value = (e.target as HTMLSelectElement)
                  .value as MachineSearchPeriod;
              }}
              class="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="daily">デイリー</option>
              <option value="monthly">マンスリー</option>
              <option value="total">累計</option>
            </select>
          </div>

          {period.value === "daily" && (
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-600">
                日付
              </label>
              <input
                type="date"
                value={date.value}
                onInput={(e) => {
                  date.value = (e.target as HTMLInputElement).value;
                }}
                class="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {period.value === "monthly" && (
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-600">
                月
              </label>
              <input
                type="month"
                value={month.value}
                onInput={(e) => {
                  month.value = (e.target as HTMLInputElement).value;
                }}
                class="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void load()}
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            表示
          </button>
        </div>
      </section>

      {loading.value && (
        <div class="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
          読み込み中...
        </div>
      )}

      {!loading.value && error.value && (
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error.value}
        </div>
      )}

      {!loading.value && !error.value && data.value && (
        <section class="rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="mb-3 text-lg font-bold text-gray-900">
            ゲーム詳細ランキング ({formatTarget(
              data.value.period,
              data.value.target,
            )})
          </h2>

          {data.value.items.length === 0
            ? <p class="text-sm text-gray-600">該当データはありません。</p>
            : (
              <div class="overflow-x-auto">
                <table class="min-w-full border-collapse">
                  <thead>
                    <tr class="border-y border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                      <th class="px-3 py-2 text-left">順位</th>
                      <th class="px-3 py-2 text-left">ゲーム名</th>
                      <th class="px-3 py-2 text-right">表示回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.value.items.map((item, idx) => (
                      <tr
                        key={`${item.value}-${idx}`}
                        class="border-b border-gray-100"
                      >
                        <td class="px-3 py-2 text-sm text-gray-700">
                          {idx + 1}
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-900">
                          {item.value}
                        </td>
                        <td class="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                          {item.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
