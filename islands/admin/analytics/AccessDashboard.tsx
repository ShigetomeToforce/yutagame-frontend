import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import {
  type AccessDashboard,
  fetchAccessDashboard,
  type TopItem,
} from "../../../utils/adminAccessLog.ts";

function TopList({ title, items }: { title: string; items: TopItem[] }) {
  return (
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <h3 class="text-sm font-semibold text-gray-700">{title}</h3>
      {items.length === 0
        ? <p class="mt-2 text-xs text-gray-500">データなし</p>
        : (
          <ul class="mt-2 space-y-1 text-sm">
            {items.map((item) => (
              <li class="flex items-center justify-between gap-3">
                <span class="truncate text-gray-700">{item.value}</span>
                <span class="font-semibold text-gray-900">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

function KpiCard(
  { label, value }: { label: string; value: number },
) {
  return (
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <p class="text-xs font-semibold tracking-wide text-gray-500">{label}</p>
      <p class="mt-1 text-2xl font-bold text-gray-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AccessDashboard() {
  const loading = useSignal(true);
  const error = useSignal("");
  const dashboard = useSignal<AccessDashboard | null>(null);

  useEffect(() => {
    (async () => {
      loading.value = true;
      error.value = "";
      try {
        dashboard.value = await fetchAccessDashboard();
      } catch (err) {
        error.value = err instanceof Error
          ? err.message
          : "ダッシュボードの取得に失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
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

  if (!dashboard.value) {
    return (
      <div class="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
        データがありません。
      </div>
    );
  }

  const daily = dashboard.value.daily;
  const monthly = dashboard.value.monthly;

  return (
    <div class="space-y-6">
      <section class="space-y-3">
        <div>
          <h2 class="text-lg font-bold text-gray-900">
            日次KPI ({daily.from})
          </h2>
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <KpiCard label="PV" value={daily.pageViews} />
          <KpiCard label="UU" value={daily.uniqueVisitors} />
          <KpiCard label="API" value={daily.apiCalls} />
          <KpiCard label="検索" value={daily.searchCount} />
          <KpiCard label="外部誘導" value={daily.affiliateClicks} />
          <KpiCard label="エラー" value={daily.errorCount} />
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h2 class="text-lg font-bold text-gray-900">
            月次KPI ({monthly.from} - {monthly.to})
          </h2>
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <KpiCard label="PV" value={monthly.pageViews} />
          <KpiCard label="UU" value={monthly.uniqueVisitors} />
          <KpiCard label="API" value={monthly.apiCalls} />
          <KpiCard label="検索" value={monthly.searchCount} />
          <KpiCard label="外部誘導" value={monthly.affiliateClicks} />
          <KpiCard label="エラー" value={monthly.errorCount} />
        </div>
      </section>

      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <TopList title="機種 指定数 Top5" items={monthly.topMachines} />
        <TopList
          title="メーカー 指定数 Top5"
          items={monthly.topManufacturers}
        />
        <TopList title="ジャンル 指定数 Top5" items={monthly.topGenres} />
        <TopList title="キーワード 指定数 Top5" items={monthly.topKeywords} />
        <TopList title="検索ワード Top5" items={monthly.topSearchWords} />
      </section>
    </div>
  );
}
