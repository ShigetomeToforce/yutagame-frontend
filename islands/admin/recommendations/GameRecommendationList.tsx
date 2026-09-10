import { adminFetch } from "../../../utils/api.ts";
import type { GameRecommendationItem } from "../../../utils/appApi.ts";
import PaginatedResourceTable, {
  type PaginatedResponse,
} from "../common/PaginatedResourceTable.tsx";

export default function GameRecommendationList() {
  const fetchPage = (page: number, limit: number, query: string) =>
    adminFetch<PaginatedResponse<GameRecommendationItem>>(
      `/admin/game-recommendations?page=${page}&limit=${limit}&q=${
        encodeURIComponent(query)
      }`,
    );
  return (
    <PaginatedResourceTable<GameRecommendationItem>
      fetchPage={fetchPage}
      searchPlaceholder="ゲーム名称・おすすめ理由で検索"
      emptyMessage="おすすめゲームはまだありません。"
      emptySearchMessage="条件に一致するおすすめゲームがありません。"
      getKey={(item) => item.id}
      getRowHref={(item) => `/admin/recommendations/${item.id}`}
      rowAriaLabel={(item) => `${item.gameName} を確認`}
      getRowClassName={(item) =>
        item.status === "NEW"
          ? "bg-red-50 hover:bg-red-100"
          : item.status === "DONE"
          ? "bg-gray-100 hover:bg-gray-200"
          : "hover:bg-gray-50"}
      showRowChevron
      renderMobileRow={(item) => (
        <div class="space-y-1">
          <p class="font-semibold text-gray-900">{item.gameName}</p>
          <p class="text-xs text-gray-500">{item.status}</p>
        </div>
      )}
      renderDesktopHeader={() => (
        <>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            ゲーム名称
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            おすすめの理由
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            状態
          </th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">
            最終更新
          </th>
        </>
      )}
      renderDesktopRow={(item) => (
        <>
          <td class="px-4 py-3 font-medium text-gray-900">{item.gameName}</td>
          <td class="px-4 py-3 text-sm text-gray-700">
            <span class="line-clamp-2">{item.reason}</span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">{item.status}</td>
          <td class="px-4 py-3 text-sm text-gray-700">
            {item.updatedAt.slice(0, 10)}
          </td>
        </>
      )}
    />
  );
}
