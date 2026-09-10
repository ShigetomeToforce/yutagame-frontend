interface NavItem {
  key: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "access", label: "アクセス分析", href: "/admin/dashboard" },
  { key: "machine", label: "機種", href: "/admin/dashboard/machines" },
  {
    key: "manufacturer",
    label: "メーカー",
    href: "/admin/dashboard/manufacturers",
  },
  { key: "genre", label: "ジャンル", href: "/admin/dashboard/genres" },
  { key: "keyword", label: "キーワード", href: "/admin/dashboard/keywords" },
  {
    key: "freeword",
    label: "フリーワード",
    href: "/admin/dashboard/freewords",
  },
  { key: "game", label: "ゲーム詳細", href: "/admin/dashboard/game-views" },
];

export default function AnalyticsNav({ current }: { current: string }) {
  return (
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const active = item.key === current;
          return (
            <a
              key={item.key}
              href={item.href}
              class={`rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
