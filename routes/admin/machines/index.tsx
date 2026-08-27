import MachineList from "../../../islands/admin/machines/MachineList.tsx";

export default function MachineListPage() {
  return (
    <div class="space-y-4">
      <div class="flex justify-end">
        <a
          href="/admin/machines/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規機種登録
        </a>
      </div>

      <MachineList />
    </div>
  );
}
