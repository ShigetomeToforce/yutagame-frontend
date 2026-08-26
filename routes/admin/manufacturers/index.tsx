import ManufacturerList from "../../../islands/admin/manufacturers/ManufacturerList.tsx";

export default function ManufacturerListPage() {
  return (
    <div class="space-y-4">
      <div class="flex justify-end">
        <a
          href="/admin/manufacturers/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規メーカー登録
        </a>
      </div>

      <ManufacturerList />
    </div>
  );
}
