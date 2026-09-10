import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { fetchSiteStats, type SiteStats } from "../../utils/appApi.ts";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0円";
  return `${value.toLocaleString("ja-JP")}円`;
}

export default function PublicHeaderStats() {
  const stats = useSignal<SiteStats | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        stats.value = await fetchSiteStats();
      } catch {
        stats.value = null;
      }
    })();
  }, []);

  if (!stats.value) return null;

  return (
    <div class="flex shrink-0 items-center gap-2 rounded-xl border border-cyan-200/25 bg-black/25 px-3 py-2 text-[10px] font-bold leading-tight text-cyan-50/90 sm:text-xs">
      <span class="whitespace-nowrap">
        登録ゲーム {stats.value.gameCount.toLocaleString("ja-JP")}件
      </span>
      <span class="h-4 w-px bg-cyan-200/25" />
      <span class="whitespace-nowrap">
        総額 {formatCurrency(stats.value.totalListPrice)}
      </span>
    </div>
  );
}
