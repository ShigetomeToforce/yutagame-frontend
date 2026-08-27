import UserList from "../../../islands/admin/users/UserList.tsx";

export default function UserListPage() {
  return (
    <div class="space-y-4">
      <UserList createHref="/admin/users/create" />
    </div>
  );
}
