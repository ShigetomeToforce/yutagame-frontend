import GenreList from "../../../islands/admin/genres/GenreList.tsx";

export default function GenreListPage() {
  return (
    <div class="space-y-4">
      <GenreList createHref="/admin/genres/create" />
    </div>
  );
}
