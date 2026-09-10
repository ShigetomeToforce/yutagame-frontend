import SearchRankingDashboard from "../../../islands/admin/analytics/SearchRankingDashboard.tsx";

export default function AdminKeywordDashboardPage() {
  return (
    <SearchRankingDashboard
      navKey="keyword"
      title="キーワード"
      field="keywordCode"
      valueLabel="キーワード名"
    />
  );
}
