import FeatureList from "../../../islands/admin/features/FeatureList.tsx";
import FeaturePublishOrder from "../../../islands/admin/features/FeaturePublishOrder.tsx";

export default function FeatureListPage() {
  return (
    <div class="space-y-6">
      <FeatureList />
      <FeaturePublishOrder />
    </div>
  );
}
