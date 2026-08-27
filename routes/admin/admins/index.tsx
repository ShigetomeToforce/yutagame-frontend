import AdminList from "../../../islands/admin/admins/AdminList.tsx";

export default function AdminListPage() {
  return (
    <div class="space-y-4">
      <AdminList createHref="/admin/admins/create" />
    </div>
  );
}
