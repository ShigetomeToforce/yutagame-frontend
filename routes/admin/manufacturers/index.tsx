import ManufacturerList from "../../../islands/admin/manufacturers/ManufacturerList.tsx";

export default function ManufacturerListPage() {
  return (
    <div class="space-y-4">
      <ManufacturerList createHref="/admin/manufacturers/create" />
    </div>
  );
}
