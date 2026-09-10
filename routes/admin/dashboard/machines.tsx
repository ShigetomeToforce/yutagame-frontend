import SearchRankingDashboard from "../../../islands/admin/analytics/SearchRankingDashboard.tsx";

export default function AdminMachineDashboardPage() {
  return (
    <SearchRankingDashboard
      navKey="machine"
      title="機種"
      field="machineCode"
      valueLabel="機種名"
    />
  );
}
