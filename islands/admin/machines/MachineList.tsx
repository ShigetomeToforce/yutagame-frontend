import { adminFetch } from "../../../utils/api.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";

interface Machine {
  id: number;
  name: string;
  manufacturerName?: string;
  createdAt: string;
}

export default function MachineList() {
  return (
    <PaginatedResourceTable<Machine>
      fetchPage={async (page, limit, query) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        return await adminFetch<PaginatedResponse<Machine>>(
          `/admin/machines?${params.toString()}`,
        );
      }}
      searchPlaceholder="機種名で検索"
      emptyMessage="登録されている機種はありません。"
      emptySearchMessage="検索条件に一致する機種はありません。"
      getKey={(machine) => machine.id}
      renderDesktopHeader={() => (
        <>
          <th class="p-4 w-16">ID</th>
          <th class="p-4">名前</th>
          <th class="p-4">メーカー</th>
          <th class="p-4 w-40">登録日</th>
          <th class="p-4 w-32 text-center">操作</th>
        </>
      )}
      renderMobileRow={(machine) => (
        <>
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-mono text-gray-400 block mb-0.5">
                ID: {machine.id}
              </span>
              <h3 class="font-bold text-gray-900 text-base">{machine.name}</h3>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </button>
              <button
                type="button"
                class="text-red-600 hover:text-red-800 font-medium"
              >
                削除
              </button>
            </div>
          </div>

          <div class="text-sm space-y-1 text-gray-600">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">メーカー:</span>
              <span>{machine.manufacturerName ?? "-"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-20">登録日:</span>
              <span class="text-gray-500">
                {new Date(machine.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
        </>
      )}
      renderDesktopRow={(machine) => (
        <>
          <td class="p-4 font-mono text-gray-400">{machine.id}</td>
          <td class="p-4 font-bold text-gray-900">{machine.name}</td>
          <td class="p-4 text-gray-500">{machine.manufacturerName ?? "-"}</td>
          <td class="p-4 text-gray-400">
            {new Date(machine.createdAt).toLocaleDateString("ja-JP")}
          </td>
          <td class="p-4 text-center space-x-2">
            <button
              type="button"
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              編集
            </button>
            <button
              type="button"
              class="text-red-600 hover:text-red-800 font-medium"
            >
              削除
            </button>
          </td>
        </>
      )}
    />
  );
}
