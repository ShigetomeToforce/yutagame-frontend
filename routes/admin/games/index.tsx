import GameList from "../../../islands/admin/games/GameList.tsx";

export default function GameListPage() {
  return (
    <div class="space-y-4">
      <GameList createHref="/admin/games/create" />
    </div>
  );
}
