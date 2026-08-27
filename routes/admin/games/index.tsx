import GameList from "../../../islands/admin/games/GameList.tsx";

export default function GameListPage() {
  return (
    <div class="space-y-4">
      <div class="flex justify-end">
        <a
          href="/admin/games/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規ゲーム登録
        </a>
      </div>

      <GameList />
    </div>
  );
}
