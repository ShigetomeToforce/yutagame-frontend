import SearchRankingDashboard from "../../../islands/admin/analytics/SearchRankingDashboard.tsx";

export default function AdminFreewordDashboardPage() {
  return (
    <SearchRankingDashboard
      navKey="freeword"
      title="フリーワード"
      field="searchWord"
      valueLabel="検索語"
    />
  );
}
