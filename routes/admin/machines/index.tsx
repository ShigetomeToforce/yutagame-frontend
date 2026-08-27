import MachineList from "../../../islands/admin/machines/MachineList.tsx";

export default function MachineListPage() {
  return (
    <div class="space-y-4">
      <MachineList createHref="/admin/machines/create" />
    </div>
  );
}
