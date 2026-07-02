import AdminList from "../../islands/AdminList.tsx";

export default function AdminListPage() {
  return (
    <div class="space-y-4">
      {/* ページ内のアクションエリア */}
      <div class="flex justify-end">
        <a
          href="/admin/admins/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規スタッフ登録
        </a>
      </div>

      {/* 🏝️ データ表示の島 */}
      <AdminList />
    </div>
  );
}
