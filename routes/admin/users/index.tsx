import UserList from "../../../islands/admin/users/UserList.tsx";

export default function UserListPage() {
  return (
    <div class="space-y-4">
      <div class="flex justify-end">
        <a
          href="/admin/users/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規ユーザー登録
        </a>
      </div>

      <UserList />
    </div>
  );
}
