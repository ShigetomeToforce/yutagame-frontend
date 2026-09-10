import SearchRankingDashboard from "../../../islands/admin/analytics/SearchRankingDashboard.tsx";

export default function AdminManufacturerDashboardPage() {
  return (
    <SearchRankingDashboard
      navKey="manufacturer"
      title="メーカー"
      field="manufacturerCode"
      valueLabel="メーカー名"
    />
  );
}
