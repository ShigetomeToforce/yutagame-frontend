import SearchRankingDashboard from "../../../islands/admin/analytics/SearchRankingDashboard.tsx";

export default function AdminGenreDashboardPage() {
  return (
    <SearchRankingDashboard
      navKey="genre"
      title="ジャンル"
      field="genreCode"
      valueLabel="ジャンル名"
    />
  );
}
